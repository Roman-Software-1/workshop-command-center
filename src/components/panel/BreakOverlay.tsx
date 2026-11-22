import { Coffee, Pause, Toilet, type LucideIcon } from "lucide-react";
import { BREAK_LABEL, fmtBreak, type BreakKind } from "@/lib/break";

export const BREAK_ICON: Record<BreakKind, LucideIcon> = { bathroom: Toilet, coffee: Coffee, general: Pause };

export function BreakPicker({ onPick, onCancel }: { onPick: (k: BreakKind) => void; onCancel: () => void }) {
  return (
    <div className="music-scrim absolute inset-0 z-30 flex items-center justify-center">
      <div role="dialog" aria-label="Choose break type" className="music-card rounded-2xl border-2 border-[var(--status-break)]/50 bg-card px-8 py-6 text-center shadow-2xl">
        <div className="mb-5 font-mono text-sm uppercase tracking-[0.3em] text-muted-foreground">What kind of break?</div>
        <div className="flex gap-5">
          {(Object.keys(BREAK_ICON) as BreakKind[]).map((k) => {
            const Icon = BREAK_ICON[k];
            return (
              <button key={k} aria-label={BREAK_LABEL[k]} onClick={() => onPick(k)} className="flex h-36 w-36 flex-col items-center justify-center gap-3 rounded-xl border-2 border-[var(--status-break)]/40 text-[var(--status-break)] transition-all active:scale-95 active:bg-[var(--status-break)]/15">
                <Icon size={64} strokeWidth={1.75} />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{BREAK_LABEL[k]}</span>
              </button>
            );
          })}
        </div>
        <button onClick={onCancel} className="mt-5 h-10 rounded-md px-6 font-mono text-sm uppercase text-muted-foreground active:scale-95">Cancel</button>
      </div>
    </div>
  );
}

export function BreakOverlay({ kind, startedAt, now, onResume, onClockOut }: { kind: BreakKind; startedAt: number; now: number; onResume: () => void; onClockOut: () => void }) {
  const Icon = BREAK_ICON[kind];
  const started = new Date(startedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <div className="music-scrim absolute inset-0 z-30 flex flex-col items-center justify-center text-center" role="dialog" aria-label="On break">
      <div className="flex items-center gap-3 font-mono text-xl font-bold uppercase tracking-[0.3em] text-[var(--status-break)]">
        <Icon size={32} /> {BREAK_LABEL[kind]} break
      </div>
      <div data-testid="break-timer" className="mt-2 font-mono text-[170px] font-extrabold leading-none tabular-nums text-[var(--status-break)] [text-shadow:0_0_40px_var(--status-break)]">{fmtBreak(now - startedAt)}</div>
      <div className="mt-2 font-mono text-sm text-muted-foreground">started {started}</div>
      <div className="mt-8 flex gap-6">
        <button onClick={onResume} className="h-16 w-64 rounded-lg bg-[var(--status-in)] font-mono text-lg font-bold uppercase text-primary-foreground shadow-[0_0_24px_-4px_var(--status-in)] active:scale-95">Back to work</button>
        <button onClick={onClockOut} className="h-16 w-64 rounded-lg bg-[var(--status-out)] font-mono text-lg font-bold uppercase text-primary-foreground shadow-[0_0_24px_-4px_var(--status-out)] active:scale-95">Clock out</button>
      </div>
    </div>
  );
}
