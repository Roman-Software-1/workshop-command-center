// Spotify's official embedded player. Swap SPOTIFY_EMBED_URL for any playlist/album/track link.
const SPOTIFY_EMBED_URL =
  "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator&theme=0";

export function SpotifyWidget() {
  return (
    <section aria-label="Spotify player" className="h-24 overflow-hidden rounded-md border border-spotify/40">
      <iframe
        title="Spotify player"
        src={SPOTIFY_EMBED_URL}
        width="100%"
        height="96"
        className="block border-0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </section>
  );
}
