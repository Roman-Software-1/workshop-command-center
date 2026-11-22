import { useEffect, useState, type MouseEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pause, Play, SkipBack, SkipForward, Music } from "lucide-react";
import { useAccount } from "@/components/account/AuthProvider";
import { SpotifyModal } from "./SpotifyModal";
import { getNowPlaying, getSpotifyAccess, spotifyControl, startSpotifyAuth } from "@/lib/spotify.functions";

const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

export function SpotifyWidget() {
  const { user } = useAccount();
  const fetchNow = useServerFn(getNowPlaying);
  const fetchAccess = useServerFn(getSpotifyAccess);
  const start = useServerFn(startSpotifyAuth);
  const ctrl = useServerFn(spotifyControl);
  const now = useQuery({ queryKey: ["spotify", "now"], queryFn: () => fetchNow(), refetchInterval: 5000, retry: false });
  const access = useQuery({ queryKey: ["spotify", "access", user?.id], queryFn: () => fetchAccess(), enabled: !!user, retry: false });
  const [tick, setTick] = useState(Date.now());
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const np = now.data;
  const playing = np?.status === "playing";
  useEffect(() => { if (!playing) return; const t = setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(t); }, [playing]);

  const act = useMutation({
    mutationFn: (action: "play" | "pause" | "next" | "previous") => ctrl({ data: { action } }),
    onSuccess: () => { setMsg(null); setTimeout(() => void now.refetch(), 400); },
    onError: (e) => setMsg(e instanceof Error ? e.message : "Spotify didn't respond"),
  });
  const connect = useMutation({
    mutationFn: () => start(),
    onSuccess: ({ url }) => { window.top ? (window.top.location.href = url) : (window.location.href = url); },
    onError: (e) => setMsg(e instanceof Error ? e.message : "Couldn't start Spotify sign-in"),
  });

  const canControl = !!access.data?.isOwner;
  const shell = "flex h-20 w-full items-center gap-3 rounded-xl border border-border bg-card px-3";

  if (!np || np.status === "disconnected" || np.status === "error" || np.status === "idle") {
    const text = !np ? "Loading Spotify…" : np.status === "error" ? "Can't reach Spotify right now" : np.status === "idle" ? "Nothing playing" : "Spotify not connected";
    return (
      <section aria-label="Spotify" className={shell}>
        <Music className="h-6 w-6 text-muted-foreground" />
        <span className="flex-1 text-sm text-muted-foreground">{msg ?? text}</span>
        {np?.status === "disconnected" && (user
          ? <button onClick={() => connect.mutate()} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Connect Spotify</button>
          : <a href="/auth" className="text-sm underline text-muted-foreground">Sign in to connect</a>)}
      </section>
    );
  }

  if (np.status !== "playing" && np.status !== "paused") return null;
  const progress = Math.min(np.durationMs, np.progressMs + (playing ? tick - np.fetchedAt : 0));
  const stop = (e: MouseEvent) => e.stopPropagation();
  const btn = "grid h-11 w-11 place-items-center rounded-full bg-secondary text-secondary-foreground disabled:opacity-40";
  return (
    <>
    <section aria-label="Now playing on Spotify" role="button" tabIndex={0} onClick={() => setOpen(true)}
      onKeyDown={(e) => e.key === "Enter" && setOpen(true)} className={`${shell} cursor-pointer`}>
      {np.art ? <img src={np.art} alt="" className="h-14 w-14 rounded-md object-cover" /> : <Music className="h-10 w-10" />}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{np.title}</div>
        <div className="truncate text-xs text-muted-foreground">{msg ?? np.artists}</div>
        <div className="mt-1 flex items-center gap-2 text-[10px] tabular-nums text-muted-foreground">
          <span>{fmt(progress)}</span>
          <div className="h-1 flex-1 rounded bg-muted"><div className="h-1 rounded bg-primary" style={{ width: `${np.durationMs ? (progress / np.durationMs) * 100 : 0}%` }} /></div>
          <span>{fmt(np.durationMs)}</span>
        </div>
      </div>
      <button aria-label="Previous" disabled={!canControl || act.isPending} onClick={(e) => { stop(e); act.mutate("previous"); }} className={btn}><SkipBack className="h-5 w-5" /></button>
      <button aria-label={playing ? "Pause" : "Play"} disabled={!canControl || act.isPending} onClick={(e) => { stop(e); act.mutate(playing ? "pause" : "play"); }} className={btn}>{playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</button>
      <button aria-label="Next" disabled={!canControl || act.isPending} onClick={(e) => { stop(e); act.mutate("next"); }} className={btn}><SkipForward className="h-5 w-5" /></button>
    </section>
    {open && <SpotifyModal np={np} progress={progress} canControl={canControl} onClose={() => setOpen(false)} onChanged={() => void now.refetch()} />}
    </>
  );
}
