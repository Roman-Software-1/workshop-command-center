import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { signState, SPOTIFY_SCOPES } from "./spotify-core";
import { control, fetchNowPlaying, getOwnerId } from "./spotify.server";

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

export const spotifyControl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ action: z.enum(["play", "pause", "next", "previous"]) }).parse(d))
  .handler(async ({ data, context }) => {
    if ((await getOwnerId()) !== context.userId) throw new Error("Only the Spotify owner can control playback");
    await control(data.action);
    return { ok: true };
  });
