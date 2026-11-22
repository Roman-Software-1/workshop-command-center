// Pure helpers shared by Spotify server code and tests (no secrets read here).
export type NowPlaying =
  | { status: "playing" | "paused"; title: string; artists: string; art: string | null; progressMs: number; durationMs: number; fetchedAt: number }
  | { status: "idle" | "disconnected" | "error"; fetchedAt: number };

export const SPOTIFY_SCOPES = "user-read-currently-playing user-read-playback-state user-modify-playback-state";

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function hmac(secret: string, msg: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
}

export async function signState(userId: string, secret: string, now = Date.now()) {
  const payload = `${userId}.${now}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

/** Returns the user id when the state is authentic and under 10 minutes old. */
export async function verifyState(state: string, secret: string, now = Date.now()): Promise<string | null> {
  const parts = state.split(".");
  if (parts.length !== 3) return null;
  const [userId, ts, sig] = parts as [string, string, string];
  const t = Number(ts);
  if (!Number.isFinite(t) || now - t > 10 * 60_000 || t - now > 60_000) return null;
  const expected = await hmac(secret, `${userId}.${ts}`);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0 ? userId : null;
}

/** Explicit projection of Spotify's currently-playing payload. */
export function projectNowPlaying(raw: unknown, fetchedAt = Date.now()): NowPlaying {
  const r = raw as { is_playing?: boolean; progress_ms?: number; item?: { name?: string; duration_ms?: number; artists?: { name?: string }[]; album?: { images?: { url?: string }[] } } } | null;
  const item = r?.item;
  if (!item?.name) return { status: "idle", fetchedAt };
  return {
    status: r?.is_playing ? "playing" : "paused",
    title: String(item.name),
    artists: (item.artists ?? []).map((a) => a.name).filter(Boolean).join(", "),
    art: item.album?.images?.[0]?.url ?? null,
    progressMs: Number(r?.progress_ms ?? 0),
    durationMs: Number(item.duration_ms ?? 0),
    fetchedAt,
  };
}
