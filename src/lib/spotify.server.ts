import { projectNowPlaying, type NowPlaying } from "./spotify-core";

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

export async function control(action: "play" | "pause" | "next" | "previous") {
  const token = await accessToken();
  if (!token) throw new Error("Spotify is not connected");
  const path = action === "next" || action === "previous" ? `/me/player/${action}` : `/me/player/${action}`;
  const res = await fetch(`${API}${path}`, { method: action === "play" || action === "pause" ? "PUT" : "POST", headers: { Authorization: `Bearer ${token}` } });
  cache = null;
  if (!res.ok && res.status !== 204) {
    const body = await res.text();
    console.error(`Spotify control failed [${res.status}]: ${body.slice(0, 200)}`);
    throw new Error(res.status === 404 ? "No active Spotify device. Start playing on your phone first." : `Spotify refused the command [${res.status}]`);
  }
}
