import type { LedState } from "@/lib/led";

type LedTuneTabProps = {
  led: LedState;
  onPatchImmediate: (patch: Partial<LedState>) => void;
  onPatchDebounced: (patch: Partial<LedState>) => void;
  onFlush: () => void;
};

export function LedTuneTab({ led, onPatchImmediate, onPatchDebounced, onFlush }: LedTuneTabProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/40 p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Motion & Geometry</span>
          <button
            type="button"
            onClick={() => onPatchImmediate({ direction: led.direction === 1 ? -1 : 1 })}
            className="rounded-md border border-border bg-secondary px-2.5 py-1 font-mono text-[11px] font-bold uppercase text-secondary-foreground active:scale-95"
          >
            {led.direction === 1 ? "Forward →" : "← Reverse"}
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>Saturation</span>
            <span className="tabular-nums text-foreground">{Math.round(led.sat)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(led.sat)}
            onChange={(e) => onPatchDebounced({ sat: Number(e.target.value) })}
            onPointerUp={onFlush}
            className="led-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary"
          />
        </label>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>Gradient spacing</span>
            <span className="tabular-nums text-foreground">{led.spacing} groups</span>
          </div>
          <input
            type="range"
            min={4}
            max={200}
            value={led.spacing}
            onChange={(e) => onPatchDebounced({ spacing: Number(e.target.value) })}
            onPointerUp={onFlush}
            className="led-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary"
          />
        </label>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>Chase / tail width</span>
            <span className="tabular-nums text-foreground">{led.chaseWidth} groups</span>
          </div>
          <input
            type="range"
            min={1}
            max={40}
            value={led.chaseWidth}
            onChange={(e) => onPatchDebounced({ chaseWidth: Number(e.target.value) })}
            onPointerUp={onFlush}
            className="led-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary"
          />
        </label>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>Preset fade</span>
            <span className="tabular-nums text-foreground">{led.transitionMs} ms</span>
          </div>
          <input
            type="range"
            min={0}
            max={3000}
            step={50}
            value={led.transitionMs}
            onChange={(e) => onPatchDebounced({ transitionMs: Number(e.target.value) })}
            onPointerUp={onFlush}
            className="led-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/40 p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Breathing</span>
          <button
            type="button"
            onClick={() => onPatchImmediate({ breathing: !led.breathing })}
            className={`rounded-md border px-2.5 py-1 font-mono text-[11px] font-bold uppercase active:scale-95 ${
              led.breathing ? "border-foreground bg-foreground text-background" : "border-border bg-secondary text-secondary-foreground"
            }`}
          >
            {led.breathing ? "On" : "Off"}
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>Cycle period</span>
            <span className="tabular-nums text-foreground">{led.breathPeriodSec}s</span>
          </div>
          <input
            type="range"
            min={2}
            max={20}
            step={0.5}
            value={led.breathPeriodSec}
            disabled={!led.breathing}
            onChange={(e) => onPatchDebounced({ breathPeriodSec: Number(e.target.value) })}
            onPointerUp={onFlush}
            className="led-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary disabled:opacity-40"
          />
        </label>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>Min brightness</span>
            <span className="tabular-nums text-foreground">{led.breathMin}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={led.breathMax}
            value={led.breathMin}
            disabled={!led.breathing}
            onChange={(e) => onPatchDebounced({ breathMin: Number(e.target.value) })}
            onPointerUp={onFlush}
            className="led-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary disabled:opacity-40"
          />
        </label>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>Max brightness</span>
            <span className="tabular-nums text-foreground">{led.breathMax}%</span>
          </div>
          <input
            type="range"
            min={Math.max(1, led.breathMin)}
            max={100}
            value={led.breathMax}
            disabled={!led.breathing}
            onChange={(e) => onPatchDebounced({ breathMax: Number(e.target.value) })}
            onPointerUp={onFlush}
            className="led-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary disabled:opacity-40"
          />
        </label>
      </div>
    </div>
  );
}