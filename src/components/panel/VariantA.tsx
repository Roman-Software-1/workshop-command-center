import { Power } from "lucide-react";
import { PRESETS, RIZE, STATUS_LABEL, TODAY, fmtMin } from "@/lib/panel-data";
import type { Panel } from "./usePanel";
import { IndicatorLight, LightBank } from "./IndicatorLights";

// A: Instrument panel — thin rules, mono numerals, gauge feel.
export function VariantA({ p }: { p: Panel }) {
  return (
    <div className="grid h-full grid-cols-[440px_1fr] divide-x divide-border">
      <section className="flex flex-col gap-4 p-5">
        <button onClick={() => p.setLights(!p.lights)} className={`flex h-28 items-center justify-between rounded-md border-2 px-6 ${p.lights ? "border-primary bg-primary/10 status-glow" : "border-border"}`}>
          <div className="text-left">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Master lights</div>
            <div className="font-mono text-4xl font-extrabold">{p.lights ? "ON" : "OFF"}</div>
          </div>
          <div className="flex flex-col items-end gap-4">
            <Power className={`h-12 w-12 ${p.lights ? "text-primary" : "text-muted-foreground"}`} />
            <LightBank className={p.lights ? "opacity-100" : "opacity-30"} />
          </div>
        </button>
        <div>
          <Label>Presets</Label>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((x) => (
              <button key={x.id} onClick={() => p.setPreset(x.id)} className={`h-14 rounded-md border font-mono text-sm uppercase ${p.preset === x.id ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{x.label}</button>
            ))}
          </div>
        </div>
        <div className="mt-auto">
          <Label>Today</Label>
          <Row k="Hours worked" v={fmtMin(TODAY.hoursWorkedMin)} />
          <Row k="Tasks done" v={`${TODAY.tasksDone}/${TODAY.tasksTotal}`} />
          <Row k="Focus time" v={fmtMin(TODAY.focusMin)} />
        </div>
      </section>
      <section className="flex flex-col">
        <div className="flex items-end justify-between border-b border-border p-5 pt-10">
          <div>
            <div className="font-mono text-6xl font-extrabold leading-none">{p.time}</div>
            <div className="mt-1 text-sm text-muted-foreground">{p.date}</div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 font-mono text-xs uppercase tracking-[0.3em] text-primary">
              <IndicatorLight className="h-2 w-2" />
              {STATUS_LABEL[p.status]}
            </div>
            <div className="font-mono text-3xl">{p.timer}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 border-b border-border p-3">
          {(["in", "break", "out"] as const).map((s) => (
            <button key={s} onClick={() => p.setStatus(s)} className={`h-12 rounded-md border font-mono text-sm uppercase ${p.status === s ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
              {s === "in" ? "Clock in" : s === "break" ? "Break" : "Clock out"}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-hidden p-5 pt-3">
          <Label>Top tasks · ClickUp</Label>
          {p.tasks.slice(0, 4).map((t) => (
            <button key={t.id} onClick={() => p.toggleTask(t.id)} className="flex w-full items-center gap-3 border-b border-border py-2 text-left">
              <span className={`h-5 w-5 shrink-0 rounded-sm border-2 ${t.done ? "border-primary bg-primary" : "border-muted-foreground"}`} />
              <span className={`flex-1 truncate ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.title}</span>
              <span className="font-mono text-xs text-muted-foreground">{t.due}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 border-t border-border font-mono">
          <Gauge k="Focus" v={`${RIZE.focusScore}`} />
          <Gauge k="Breaks" v={`${RIZE.breaks}`} />
          <Gauge k={RIZE.topCategory} v={`${RIZE.topCategoryPct}%`} />
        </div>
      </section>
    </div>
  );
}
const Label = ({ children }: { children: React.ReactNode }) => <div className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">{children}</div>;
const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-baseline justify-between border-b border-border py-2"><span className="text-muted-foreground">{k}</span><span className="font-mono text-2xl font-semibold">{v}</span></div>
);
const Gauge = ({ k, v }: { k: string; v: string }) => (
  <div className="border-r border-border px-5 py-3 last:border-r-0"><div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Rize · {k}</div><div className="text-2xl font-extrabold">{v}</div></div>
);
