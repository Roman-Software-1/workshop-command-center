// Spotify's official embedded player. Swap SPOTIFY_EMBED_URL for any playlist/album/track link.
const SPOTIFY_EMBED_URL =
  "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator&theme=0";

export function SpotifyWidget() {
  return (
    <section aria-label="Spotify player" className="mx-auto h-20 w-full max-w-[560px] overflow-hidden rounded-xl">
      <iframe
        title="Spotify player"
        src={SPOTIFY_EMBED_URL}
        width="100%"
        height="80"
        className="block border-0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </section>
  );
}
