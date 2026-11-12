import { useState } from "react";
import { AudioLines, Pause, Play, SkipBack, SkipForward } from "lucide-react";

const TRACKS = [
  { title: "Midnight City", artist: "M83", progress: 46 },
  { title: "Nightcall", artist: "Kavinsky", progress: 28 },
  { title: "Instant Crush", artist: "Daft Punk", progress: 67 },
] as const;

// Visual Spotify mockup; playback controls only change the on-screen sample.
export function SpotifyWidget() {
  const [playing, setPlaying] = useState(true);
  const [trackIndex, setTrackIndex] = useState(0);
  const track = TRACKS[trackIndex] ?? TRACKS[0];
  const skip = (direction: number) => {
    setTrackIndex((current) => (current + direction + TRACKS.length) % TRACKS.length);
  };

  return (
    <section aria-label="Spotify player" className="flex h-24 items-center gap-3 rounded-md border border-spotify/40 bg-spotify/5 p-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border border-spotify/30 bg-spotify/15 text-spotify">
        <AudioLines className="h-7 w-7" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-spotify">Spotify</span>
          <span className="spotify-eq" data-playing={playing} aria-hidden="true"><span /><span /><span /><span /></span>
        </div>
        <div className="truncate text-base font-semibold leading-tight">{track.title}</div>
        <div className="truncate text-xs text-muted-foreground">{track.artist}</div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-spotify transition-[width] duration-500" style={{ width: `${track.progress}%` }} />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" aria-label="Previous track" onClick={() => skip(-1)} className="flex h-10 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95">
          <SkipBack className="h-5 w-5" fill="currentColor" />
        </button>
        <button type="button" aria-label={playing ? "Pause music" : "Play music"} onClick={() => setPlaying((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-full bg-spotify text-spotify-foreground shadow-[0_0_14px_-3px_var(--spotify)] transition-transform active:scale-95">
          {playing ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
        </button>
        <button type="button" aria-label="Next track" onClick={() => skip(1)} className="flex h-10 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95">
          <SkipForward className="h-5 w-5" fill="currentColor" />
        </button>
      </div>
    </section>
  );
}
