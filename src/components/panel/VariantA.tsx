import { VerticalSwitch } from "./VerticalSwitch";
import { RIZE, STATUS_LABEL, TODAY, fmtMin } from "@/lib/panel-data";
import type { Panel } from "./usePanel";
import { IndicatorLight, LightBank } from "./IndicatorLights";
import { SpotifyWidget } from "./SpotifyWidget";

// A: Instrument panel — thin rules, mono numerals, gauge feel.
export function VariantA({ p }: { p: Panel }) {
  return (
    <div className="flex h-full flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-[240px_1fr] divide-x divide-border">
        {/* Lights: one big, easy-to-hit switch */}
        <section className="p-4">
          <button
            type="button"
            onClick={() => p.setLights(!p.lights)}
            data-on={p.lights}
            className="lights-card flex h-full w-full flex-col items-center justify-between rounded-lg border-2 border-border py-6 transition-colors"
          >
            <div className="text-center">
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Lights</div>
              <div className="font-mono text-5xl font-extrabold" style={{ color: p.lights ? "var(--preset-work)" : undefined }}>{p.lights ? "ON" : "OFF"}</div>
            </div>
            <div className="pointer-events-none"><VerticalSwitch on={p.lights} onToggle={() => {}} large /></div>
            <LightBank className={p.lights ? "opacity-100" : "opacity-30"} />
          </button>
        </section>

        <section className="flex min-h-0 flex-col">
          {/* Hero: clock + hours worked */}
          <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
            <div className="px-6 py-5">
              <div className="font-mono text-6xl font-extrabold leading-none">{p.time}</div>
              <div className="mt-2 text-sm text-muted-foreground">{p.date}</div>
              <div className="mt-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-primary">
                <IndicatorLight className="h-2 w-2" />
                {STATUS_LABEL[p.status]} · <span className="text-foreground">{p.timer}</span>
              </div>
            </div>
            <div className="px-6 py-5">
              <Label>Hours worked</Label>
              <div className="font-mono text-5xl font-extrabold leading-none">{fmtMin(TODAY.hoursWorkedMin)}</div>
              <div className="mt-3 font-mono text-lg text-muted-foreground">
                Break <span className="text-[var(--status-break)]">{fmtMin(TODAY.breakMin)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-b border-border p-4">
            {(["in", "break", "out"] as const).map((s) => (
              <button key={s} onClick={() => p.setStatus(s)} style={{ "--c": `var(--status-${s})` } as React.CSSProperties} className={`h-14 rounded-md border-2 font-mono text-base uppercase transition-all active:scale-95 ${p.status === s ? "border-[var(--c)] bg-[var(--c)] text-primary-foreground shadow-[0_0_20px_-2px_var(--c)]" : "border-[var(--c)]/40 text-[var(--c)]"}`}>
                {s === "in" ? "Clock in" : s === "break" ? "Break" : "Clock out"}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden px-6 pt-4">
            <Label>Top tasks · ClickUp</Label>
            {p.tasks.slice(0, 4).map((t) => (
              <button key={t.id} onClick={() => p.toggleTask(t.id)} className="flex w-full items-center gap-3 border-b border-border py-3 text-left last:border-b-0">
                <span className={`h-5 w-5 shrink-0 rounded-sm border-2 ${t.done ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                <span className={`flex-1 truncate ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.title}</span>
                <span className="font-mono text-xs text-muted-foreground">{t.due}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 border-t border-border font-mono">
            <Gauge k="Tasks" v={`${TODAY.tasksDone}/${TODAY.tasksTotal}`} />
            <Gauge k="Focus time" v={fmtMin(TODAY.focusMin)} />
            <Gauge k="Focus score" v={`${RIZE.focusScore}`} />
            <Gauge k={RIZE.topCategory} v={`${RIZE.topCategoryPct}%`} />
          </div>
        </section>
      </div>
      <div className="flex items-center justify-center border-t border-border bg-card/40 px-5 py-3"><SpotifyWidget /></div>
    </div>
  );
}
const Label = ({ children }: { children: React.ReactNode }) => <div className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">{children}</div>;
const Gauge = ({ k, v }: { k: string; v: string }) => (
  <div className="border-r border-border px-5 py-3 last:border-r-0"><div className="truncate text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{k}</div><div className="text-2xl font-extrabold">{v}</div></div>
);
