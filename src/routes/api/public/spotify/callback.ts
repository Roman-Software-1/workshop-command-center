import { createFileRoute } from "@tanstack/react-router";
import { verifyState } from "@/lib/spotify-core";

export const Route = createFileRoute("/api/public/spotify/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const back = (s: string) => Response.redirect(`${url.origin}/a?spotify=${s}`, 302);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const secret = process.env["SPOTIFY_STATE_SECRET"];
        if (!code || !state || !secret || code.length > 1000) return back("error");
        const userId = await verifyState(state, secret);
        if (!userId) return back("error");
        const { exchangeCode, getOwnerId } = await import("@/lib/spotify.server");
        const owner = await getOwnerId();
        if (owner && owner !== userId) return back("error");
        try {
          await exchangeCode(code, `${url.origin}/api/public/spotify/callback`, userId);
          return back("connected");
        } catch (e) {
          console.error("Spotify callback:", e instanceof Error ? e.message : "unknown");
          return back("error");
        }
      },
    },
  },
});
