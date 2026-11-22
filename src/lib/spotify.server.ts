import { projectNowPlaying, type NowPlaying, type PlayerAction, type PlayerDetails } from "./spotify-core";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";

function creds() {
  const id = process.env["SPOTIFY_CLIENT_ID"];
  const secret = process.env["SPOTIFY_CLIENT_SECRET"];
  if (!id || !secret) throw new Error("Spotify app credentials are not configured");
  return { id, secret, basic: btoa(`${id}:${secret}`) };
}

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

export async function getOwnerId(): Promise<string | null> {
  const { data } = await (await admin()).from("spotify_tokens").select("owner_id").eq("id", 1).maybeSingle();
  return data?.owner_id ?? null;
}

export async function exchangeCode(code: string, redirectUri: string, ownerId: string) {
  const { basic } = creds();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
  });
  if (!res.ok) throw new Error(`Spotify token exchange failed [${res.status}]`);
  const j = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
  const { error } = await (await admin()).from("spotify_tokens").upsert({
    id: 1, owner_id: ownerId, refresh_token: j.refresh_token, access_token: j.access_token,
    expires_at: new Date(Date.now() + (j.expires_in - 60) * 1000).toISOString(), updated_at: new Date().toISOString(),
  });
  if (error) throw new Error("Could not save Spotify sign-in");
}

async function accessToken(): Promise<string | null> {
  const db = await admin();
  const { data } = await db.from("spotify_tokens").select("*").eq("id", 1).maybeSingle();
  if (!data) return null;
  if (data.access_token && data.expires_at && new Date(data.expires_at).getTime() > Date.now()) return data.access_token;
  const { basic } = creds();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: data.refresh_token }),
  });
  if (!res.ok) throw new Error(`Spotify token refresh failed [${res.status}]`);
  const j = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  await db.from("spotify_tokens").update({
    access_token: j.access_token, refresh_token: j.refresh_token ?? data.refresh_token,
    expires_at: new Date(Date.now() + (j.expires_in - 60) * 1000).toISOString(), updated_at: new Date().toISOString(),
  }).eq("id", 1);
  return j.access_token;
}

let cache: { at: number; value: NowPlaying } | null = null;

export async function fetchNowPlaying(): Promise<NowPlaying> {
  if (cache && Date.now() - cache.at < 3000) return cache.value;
  let value: NowPlaying;
  try {
    const token = await accessToken();
    if (!token) value = { status: "disconnected", fetchedAt: Date.now() };
    else {
      const res = await fetch(`${API}/me/player/currently-playing`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 204) value = { status: "idle", fetchedAt: Date.now() };
      else if (!res.ok) { console.error(`Spotify now-playing failed [${res.status}]`); value = { status: "error", fetchedAt: Date.now() }; }
      else value = projectNowPlaying(await res.json());
    }
  } catch (e) {
    console.error("Spotify now-playing error:", e instanceof Error ? e.message : "unknown");
    value = { status: "error", fetchedAt: Date.now() };
  }
  cache = { at: Date.now(), value };
  return value;
}

async function call(path: string, init: RequestInit = {}) {
  const token = await accessToken();
  if (!token) throw new Error("Spotify is not connected");
  const res = await fetch(`${API}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  if (!res.ok && res.status !== 204) {
    console.error(`Spotify ${path} failed [${res.status}]: ${(await res.text()).slice(0, 200)}`);
    if (res.status === 404) throw new Error("No active Spotify device. Start playing on your phone first.");
    if (res.status === 403 || res.status === 401) throw new Error("Spotify needs to be reconnected for this option.");
    throw new Error(`Spotify refused the command [${res.status}]`);
  }
  return res.status === 204 ? null : res.json().catch(() => null);
}

export async function control(a: PlayerAction) {
  cache = null;
  switch (a.action) {
    case "play": case "pause": return call(`/me/player/${a.action}`, { method: "PUT" });
    case "next": case "previous": return call(`/me/player/${a.action}`, { method: "POST" });
    case "shuffle": return call(`/me/player/shuffle?state=${a.on}`, { method: "PUT" });
    case "repeat": return call(`/me/player/repeat?state=${a.mode}`, { method: "PUT" });
    case "seek": return call(`/me/player/seek?position_ms=${Math.round(a.ms)}`, { method: "PUT" });
    case "volume": return call(`/me/player/volume?volume_percent=${Math.round(a.percent)}`, { method: "PUT" });
    case "device": return call(`/me/player`, { method: "PUT", body: JSON.stringify({ device_ids: [a.id], play: true }) });
    case "playlist": return call(`/me/player/play`, { method: "PUT", body: JSON.stringify({ context_uri: a.uri }) });
    case "like": case "unlike": {
      const id = await currentTrackId();
      if (!id) throw new Error("Nothing playing to like");
      return call(`/me/tracks?ids=${id}`, { method: a.action === "like" ? "PUT" : "DELETE" });
    }
  }
}

async function currentTrackId(): Promise<string | null> {
  const p = (await call("/me/player")) as { item?: { id?: string } } | null;
  return p?.item?.id ?? null;
}

const safe = async <T,>(f: () => Promise<T>, d: T) => { try { return await f(); } catch { return d; } };

export async function fetchDetails(): Promise<PlayerDetails> {
  type P = { shuffle_state?: boolean; repeat_state?: PlayerDetails["repeat"]; device?: { volume_percent?: number | null }; item?: { id?: string } };
  type Art = { name: string; artists?: { name: string }[] };
  const [p, dev, q, pl] = await Promise.all([
    safe(() => call("/me/player") as Promise<P | null>, null),
    safe(() => call("/me/player/devices") as Promise<{ devices: { id: string | null; name: string; type: string; is_active: boolean }[] }>, { devices: [] }),
    safe(() => call("/me/player/queue") as Promise<{ queue: Art[] }>, { queue: [] }),
    safe(() => call("/me/playlists?limit=4") as Promise<{ items: { uri: string; name: string; images?: { url: string }[] | null }[] }>, { items: [] }),
  ]);
  const id = p?.item?.id;
  const liked = id ? await safe(async () => ((await call(`/me/tracks/contains?ids=${id}`)) as boolean[])[0] ?? null, null) : null;
  return {
    shuffle: !!p?.shuffle_state, repeat: p?.repeat_state ?? "off", volume: p?.device?.volume_percent ?? null, liked,
    devices: (dev?.devices ?? []).filter((d) => d.id).map((d) => ({ id: d.id as string, name: d.name, type: d.type, active: d.is_active })),
    queue: (q?.queue ?? []).slice(0, 3).map((t) => ({ title: t.name, artists: (t.artists ?? []).map((a) => a.name).join(", ") })),
    playlists: (pl?.items ?? []).filter(Boolean).slice(0, 4).map((x) => ({ uri: x.uri, name: x.name, art: x.images?.[0]?.url ?? null })),
  };
}
