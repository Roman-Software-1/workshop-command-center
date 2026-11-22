import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { signState, SPOTIFY_SCOPES } from "./spotify-core";
import { control, fetchDetails, fetchNowPlaying, getOwnerId } from "./spotify.server";

export const getNowPlaying = createServerFn({ method: "GET" }).handler(() => fetchNowPlaying());

export const getSpotifyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const owner = await getOwnerId();
    return { connected: owner !== null, isOwner: owner === context.userId };
  });

export const startSpotifyAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const owner = await getOwnerId();
    if (owner && owner !== context.userId) throw new Error("Spotify is already connected by another account");
    const clientId = process.env["SPOTIFY_CLIENT_ID"];
    const secret = process.env["SPOTIFY_STATE_SECRET"];
    if (!clientId || !secret) throw new Error("Spotify isn't set up yet");
    const origin = new URL(getRequest().url).origin;
    const url = new URL("https://accounts.spotify.com/authorize");
    url.search = new URLSearchParams({
      response_type: "code", client_id: clientId, scope: SPOTIFY_SCOPES,
      redirect_uri: `${origin}/api/public/spotify/callback`, state: await signState(context.userId, secret),
    }).toString();
    return { url: url.toString() };
  });

export const playerActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.enum(["play", "pause", "next", "previous", "like", "unlike"]) }),
  z.object({ action: z.literal("shuffle"), on: z.boolean() }),
  z.object({ action: z.literal("repeat"), mode: z.enum(["off", "context", "track"]) }),
  z.object({ action: z.literal("seek"), ms: z.number().int().min(0).max(24 * 3600 * 1000) }),
  z.object({ action: z.literal("volume"), percent: z.number().int().min(0).max(100) }),
  z.object({ action: z.literal("device"), id: z.string().min(1).max(100) }),
  z.object({ action: z.literal("playlist"), uri: z.string().regex(/^spotify:playlist:[A-Za-z0-9]+$/) }),
]);

async function requireOwner(userId: string) {
  if ((await getOwnerId()) !== userId) throw new Error("Only the Spotify owner can control playback");
}

export const spotifyControl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => playerActionSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    await control(data);
    return { ok: true };
  });

export const getPlayerDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireOwner(context.userId);
    return fetchDetails();
  });
