import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useAccount } from "@/components/account/AuthProvider";
import { Heart, Music, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Speaker, Volume1, Volume2, X } from "lucide-react";
import { getPlayerDetails, getUpNext, spotifyControl } from "@/lib/spotify.functions";
import type { NowPlaying, PlayerAction } from "@/lib/spotify-core";
import { clampVolume, MUSIC_MODAL_IDLE_MS } from "@/lib/music-modal";

const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

type Props = { np: NowPlaying | undefined; progress: number; canControl: boolean; onClose: () => void; onChanged: () => void };

export function SpotifyModal({ np, progress, canControl, onClose, onChanged }: Props) {
  const ctrl = useServerFn(spotifyControl);
  const details = useServerFn(getPlayerDetails);
  const d = useQuery({ queryKey: ["spotify", "details"], queryFn: () => details(), enabled: canControl, refetchInterval: 5000, retry: false });
  const { user } = useAccount();
  const upNextFn = useServerFn(getUpNext);
  const upNext = useQuery({ queryKey: ["spotify", "upnext"], queryFn: () => upNextFn(), refetchInterval: 5000, retry: false });
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchY = useRef<number | null>(null);

  const bump = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(onClose, MUSIC_MODAL_IDLE_MS); };
  useEffect(() => { bump(); const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => { if (timer.current) clearTimeout(timer.current); window.removeEventListener("keydown", k); }; }, []);

  const act = useMutation({
    mutationFn: (a: PlayerAction) => ctrl({ data: a }),
    onSuccess: () => { setMsg(null); setTimeout(() => { onChanged(); void d.refetch(); }, 400); },
    onError: (e) => setMsg(e instanceof Error ? e.message : "Spotify didn't respond"),
  });
  const go = (a: PlayerAction) => { bump(); act.mutate(a); };

  const live = np && (np.status === "playing" || np.status === "paused") ? np : null;
  const playing = live?.status === "playing";
  const info = d.data;
  const vol = info?.volume ?? null;
  const dis = !canControl || act.isPending;
  const round = "grid place-items-center rounded-full bg-secondary text-secondary-foreground disabled:opacity-40";
  const chip = "rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-40";

  return (
    <div className="music-scrim fixed inset-0 z-50 grid place-items-center" onClick={onClose} onPointerDown={bump}
      onTouchStart={(e) => { touchY.current = e.touches[0]?.clientY ?? null; }}
      onTouchEnd={(e) => { const y = e.changedTouches[0]?.clientY; if (touchY.current !== null && y !== undefined && y - touchY.current > 90) onClose(); touchY.current = null; }}>
      <div role="dialog" aria-label="Music controls" onClick={(e) => e.stopPropagation()}
        className="music-card relative flex h-[460px] w-[760px] gap-6 rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <button aria-label="Close" onClick={onClose} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground"><X className="h-5 w-5" /></button>

        <div className="flex w-[230px] shrink-0 flex-col gap-3">
          {live?.art ? <img src={live.art} alt="" className="h-[230px] w-[230px] rounded-2xl object-cover shadow-lg" />
            : <div className="grid h-[230px] w-[230px] place-items-center rounded-2xl bg-muted"><Music className="h-16 w-16 text-muted-foreground" /></div>}
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Up next</div>
          <ul className="min-h-0 flex-1 space-y-1 overflow-hidden text-sm">
            {upNext.data?.length ? upNext.data.map((q, i) => <li key={i} className="truncate"><span className="font-medium">{q.title}</span> <span className="text-muted-foreground">· {q.artists}</span></li>)
              : <li className="text-muted-foreground">{upNext.isLoading ? "Loading…" : "Nothing queued"}</li>}
          </ul>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4 pr-8">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-2xl font-bold">{live?.title ?? "Nothing playing"}</div>
              <div className="truncate text-base text-muted-foreground">{msg ?? live?.artists ?? (canControl ? "Start a playlist below" : "Sign in to control music")}</div>
            </div>
            <button aria-label={info?.liked ? "Remove from Liked Songs" : "Save to Liked Songs"} disabled={dis || !live || info?.liked == null}
              onClick={() => go({ action: info?.liked ? "unlike" : "like" })} className={`${round} h-11 w-11`}>
              <Heart className={`h-5 w-5 ${info?.liked ? "fill-primary text-primary" : ""}`} />
            </button>
          </div>

          <div>
            <input type="range" aria-label="Song position" min={0} max={live?.durationMs ?? 1} value={live ? progress : 0} disabled={dis || !live}
              onChange={() => {}} onPointerUp={(e) => go({ action: "seek", ms: Number((e.target as HTMLInputElement).value) })}
              className="h-2 w-full accent-primary" />
            <div className="flex justify-between text-xs tabular-nums text-muted-foreground"><span>{fmt(live ? progress : 0)}</span><span>{fmt(live?.durationMs ?? 0)}</span></div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button aria-label="Shuffle" disabled={dis} onClick={() => go({ action: "shuffle", on: !info?.shuffle })} className={`${round} h-12 w-12 ${info?.shuffle ? "text-primary" : ""}`}><Shuffle className="h-5 w-5" /></button>
            <button aria-label="Previous" disabled={dis} onClick={() => go({ action: "previous" })} className={`${round} h-14 w-14`}><SkipBack className="h-6 w-6" /></button>
            <button aria-label={playing ? "Pause" : "Play"} disabled={dis} onClick={() => go({ action: playing ? "pause" : "play" })} className="grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">{playing ? <Pause className="h-9 w-9" /> : <Play className="h-9 w-9" />}</button>
            <button aria-label="Next" disabled={dis} onClick={() => go({ action: "next" })} className={`${round} h-14 w-14`}><SkipForward className="h-6 w-6" /></button>
            <button aria-label="Repeat" disabled={dis} onClick={() => go({ action: "repeat", mode: info?.repeat === "off" ? "context" : info?.repeat === "context" ? "track" : "off" })} className={`${round} h-12 w-12 ${info && info.repeat !== "off" ? "text-primary" : ""}`}>{info?.repeat === "track" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}</button>
          </div>

          <div className="flex items-center gap-3">
            <button aria-label="Volume down" disabled={dis || vol === null} onClick={() => go({ action: "volume", percent: clampVolume((vol ?? 0) - 10) })} className={`${round} h-10 w-10`}><Volume1 className="h-5 w-5" /></button>
            <div className="h-2 flex-1 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${vol ?? 0}%` }} /></div>
            <button aria-label="Volume up" disabled={dis || vol === null} onClick={() => go({ action: "volume", percent: clampVolume((vol ?? 0) + 10) })} className={`${round} h-10 w-10`}><Volume2 className="h-5 w-5" /></button>
            <span className="w-10 text-right text-sm tabular-nums text-muted-foreground">{vol === null ? "—" : `${vol}%`}</span>
          </div>

          <div className="flex items-center gap-2 overflow-hidden">
            <Speaker className="h-4 w-4 shrink-0 text-muted-foreground" />
            {info?.devices.length ? info.devices.slice(0, 3).map((dv) => (
              <button key={dv.id} disabled={dis || dv.active} onClick={() => go({ action: "device", id: dv.id })}
                className={`${chip} truncate ${dv.active ? "border-primary text-primary disabled:opacity-100" : ""}`}>{dv.name}</button>
            )) : <span className="text-sm text-muted-foreground">No devices found</span>}
          </div>

          {!canControl && (
            <div className="rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm">
              {user ? "This account isn't the one connected to Spotify." : <>Controls are locked. <Link to="/auth" className="font-semibold underline">Sign in</Link> to pause, skip and change songs.</>}
            </div>
          )}
          <div className="mt-auto grid grid-cols-4 gap-2">
            {info?.playlists.map((p) => (
              <button key={p.uri} disabled={dis} onClick={() => go({ action: "playlist", uri: p.uri })} className={`${chip} flex items-center gap-2 text-left`}>
                {p.art ? <img src={p.art} alt="" className="h-8 w-8 shrink-0 rounded object-cover" /> : <Music className="h-5 w-5 shrink-0" />}
                <span className="truncate text-xs">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
