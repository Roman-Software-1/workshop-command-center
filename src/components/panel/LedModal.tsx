import { useCallback, useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import { Gauge, Power, Sun, X } from "lucide-react";
import type { WorkStatus } from "@/lib/panel-data";
import { effectDurationMs, LED_EFFECTS, LED_PRESETS, ledCss, resolveLedHS, type LedEffect, type LedState } from "@/lib/led";
import { MUSIC_MODAL_IDLE_MS } from "@/lib/music-modal";

type LedModalProps = {
  led: LedState;
  status: WorkStatus;
  onColor: (hue: number, sat: number) => void;
  onPreset: (id: string) => void;
  onBrightness: (v: number) => void;
  onEffect: (e: LedEffect) => void;
  onSpeed: (v: number) => void;
  onToggle: () => void;
  onClose: () => void;
};

export function LedModal({ led, status, onColor, onPreset, onBrightness, onEffect, onSpeed, onToggle, onClose }: LedModalProps) {
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetIdle = useCallback(() => {
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(onClose, MUSIC_MODAL_IDLE_MS);
  }, [onClose]);

  useEffect(() => {
    resetIdle();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      if (idleRef.current) clearTimeout(idleRef.current);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, resetIdle]);

  const color = ledCss(led, status);
  const active = led.on && led.brightness > 0;
  const { hue, sat } = resolveLedHS(led, status);
  const dur = `${effectDurationMs(led.speed)}ms`;
  const effectLabel = LED_EFFECTS.find((e) => e.id === led.effect)?.label ?? "Solid";
  const animated = led.effect !== "solid";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bar counter LEDs"
      className="music-scrim fixed inset-0 z-40 flex items-center justify-center p-4"
      onClick={onClose}
      onPointerDown={resetIdle}
    >
      <div
        className="music-card relative flex w-[760px] flex-col gap-4 rounded-2xl border border-border bg-card/95 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + live strip preview */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-foreground">Bar counter LEDs</span>
            <span className="font-mono text-xs text-muted-foreground">{led.on ? `${led.brightness}% · ${effectLabel}` : "Off"}</span>
          </div>
          <div
            aria-hidden="true"
            data-on={active}
            data-effect={led.effect}
            className="led-strip h-3.5 flex-1 rounded-full border border-border transition-opacity"
            style={{
              "--led": color,
              "--led-dur": dur,
              opacity: active ? 0.35 + (led.brightness / 100) * 0.65 : 0.4,
            } as CSSProperties}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close LED controller"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-secondary-foreground active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body: wheel + scenes + effects */}
        <div className="grid grid-cols-[200px_1fr] items-center gap-5">
          <ColorWheel hue={hue} sat={sat} onPick={(h, s) => { resetIdle(); onColor(h, s); }} />

          <div className="flex flex-col gap-3">
            <div>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Scenes</div>
              <div className="grid grid-cols-4 gap-2">
                {LED_PRESETS.map((p) => {
                  const selected = led.on && led.preset === p.id;
                  const swatch = p.swatch ?? ledCss({ hue: p.hue, sat: p.sat, preset: p.id }, status);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { resetIdle(); onPreset(p.id); }}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 font-mono text-[11px] transition-all active:scale-95 ${selected ? "border-foreground bg-secondary text-secondary-foreground" : "border-border bg-background/60 text-muted-foreground"}`}
                    >
                      <span className="h-6 w-6 rounded-full border border-border/60" style={{ background: swatch }} />
                      <span className="truncate">{p.label}</span>
                    </button>
                  );
                })}
                {(() => {
                  const selected = led.on && led.preset === "status";
                  const swatch = ledCss({ hue: 0, sat: 0, preset: "status" }, status);
                  return (
                    <button
                      type="button"
                      onClick={() => { resetIdle(); onPreset("status"); }}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 font-mono text-[11px] transition-all active:scale-95 ${selected ? "border-foreground bg-secondary text-secondary-foreground" : "border-border bg-background/60 text-muted-foreground"}`}
                    >
                      <span className="h-6 w-6 rounded-full border border-border/60" style={{ background: swatch }} />
                      <span className="truncate">Work status</span>
                    </button>
                  );
                })()}
              </div>
            </div>

            <div>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Effects</div>
              <div className="grid grid-cols-6 gap-1.5">
                {LED_EFFECTS.map((e) => {
                  const selected = led.on && led.effect === e.id;
                  return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => { resetIdle(); onEffect(e.id); }}
                    className={`rounded-lg border px-2 py-2 font-mono text-[11px] font-medium transition-all active:scale-95 ${selected ? "border-foreground bg-secondary text-secondary-foreground" : "border-border bg-background/60 text-muted-foreground"}`}
                  >
                    {e.label}
                  </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer: brightness + speed + On/Off */}
        <div className="flex items-center gap-4 border-t border-border pt-4">
          <div className="flex flex-1 items-center gap-2.5">
            <Sun className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="range"
              min={0}
              max={100}
              value={led.brightness}
              aria-label="Brightness"
              onChange={(e) => { resetIdle(); onBrightness(Number(e.target.value)); }}
              style={{ "--led": color } as CSSProperties}
              className="led-slider flex-1"
            />
            <span className="w-10 text-right font-mono text-xs font-bold">{led.brightness}%</span>
          </div>
          <div className={`flex flex-1 items-center gap-2.5 transition-opacity ${animated ? "opacity-100" : "opacity-40"}`}>
            <Gauge className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="range"
              min={1}
              max={100}
              value={led.speed}
              disabled={!animated}
              aria-label="Effect speed"
              onChange={(e) => { resetIdle(); onSpeed(Number(e.target.value)); }}
              style={{ "--led": color } as CSSProperties}
              className="led-slider flex-1"
            />
            <span className="w-10 text-right font-mono text-xs font-bold">{led.speed}%</span>
          </div>
          <button
            type="button"
            onClick={() => { resetIdle(); onToggle(); }}
            className={`flex h-11 items-center gap-2 rounded-full border-2 px-5 font-mono text-sm font-bold uppercase transition-all active:scale-95 ${led.on ? "border-foreground bg-foreground text-background" : "border-border bg-secondary text-muted-foreground"}`}
          >
            <Power className="h-4 w-4" />
            {led.on ? "On" : "Off"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ColorWheel({ hue, sat, onPick }: { hue: number; sat: number; onPick: (h: number, s: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const pickAt = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const r = rect.width / 2;
    const dx = clientX - (rect.left + r);
    const dy = clientY - (rect.top + r);
    const dist = Math.min(r, Math.hypot(dx, dy));
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    const h = ((angle % 360) + 360) % 360;
    const s = Math.round((dist / r) * 100);
    onPick(Math.round(h), s);
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pickAt(e.clientX, e.clientY);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.buttons > 0 || e.pointerType === "touch") pickAt(e.clientX, e.clientY);
  };

  const rad = ((hue - 90) * Math.PI) / 180;
  const pct = (sat / 100) * 50;
  const left = 50 + Math.cos(rad) * pct;
  const top = 50 + Math.sin(rad) * pct;

  return (
    <div
      ref={ref}
      role="slider"
      aria-label="Color wheel"
      aria-valuetext={`Hue ${hue}, saturation ${sat}%`}
      tabIndex={0}
      onPointerDown={onDown}
      onPointerMove={onMove}
      className="relative mx-auto h-[196px] w-[196px] touch-none select-none rounded-full border-2 border-border shadow-inner"
      style={{
        background:
          "radial-gradient(circle, white 0%, transparent 72%), conic-gradient(hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))",
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-[0_0_0_2px_var(--foreground)]"
        style={{ left: `${left}%`, top: `${top}%`, background: `hsl(${hue} ${sat}% 55%)` }}
      />
    </div>
  );
}