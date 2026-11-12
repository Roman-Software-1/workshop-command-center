import { Lightbulb } from "lucide-react";
import { PRESETS, RIZE, STATUS_LABEL, TODAY, fmtMin } from "@/lib/panel-data";
import type { Panel } from "./usePanel";
import { IndicatorLight, LightBank } from "./IndicatorLights";

// C: Clean minimal — clock is the hero.
export function VariantC({ p }: { p: Panel }) {
  return (
    <div className="grid h-full grid-cols-[300px_1fr]">
      <aside className="flex flex-col gap-5 bg-card p-6">
        <button onClick={() => p.setLights(!p.lights)} className="flex w-full items-center gap-4">
          <span className={`relative h-12 w-[88px] rounded-full transition ${p.lights ? "bg-primary" : "bg-muted"}`}>
            <span className={`absolute top-1 h-10 w-10 rounded-full bg-foreground transition-all ${p.lights ? "left-11" : "left-1"}`} />
          </span>
          <span className="text-left"><span className="block text-lg font-medium">All lights</span><span className="text-sm text-muted-foreground">{p.lights ? "On" : "Off"}</span></span>
          <LightBank effect="soft" lightClassName="h-1.5 w-1.5" className={`ml-auto ${p.lights ? "opacity-100" : "opacity-30"}`} />
        </button>
        <div className="flex flex-col gap-1">
          {PRESETS.map((x) => (
            <button key={x.id} onClick={() => p.setPreset(x.id)} className={`flex h-11 items-center gap-3 rounded-lg px-3 text-left ${p.preset === x.id ? "bg-muted text-foreground" : "text-muted-foreground"}`}>
              <Lightbulb className={`h-4 w-4 ${p.preset === x.id ? "text-primary" : ""}`} />{x.label}
            </button>
          ))}
        </div>
        <div className="mt-auto space-y-3">
          <Mini k="Worked today" v={fmtMin(TODAY.hoursWorkedMin)} />
          <Mini k="Tasks completed" v={`${TODAY.tasksDone} of ${TODAY.tasksTotal}`} />
          <Mini k="Focus · Rize" v={`${RIZE.focusScore}% · ${RIZE.breaks} breaks`} />
        </div>
      </aside>
      <main className="flex flex-col px-10 py-8">
        <div className="text-sm text-muted-foreground">{p.date}</div>
        <div className="text-[112px] font-light leading-none tracking-tight">{p.time}</div>
        <div className="mt-3 flex items-center gap-4">
          <span className="flex items-center gap-2 text-primary"><IndicatorLight effect="soft" className="h-2.5 w-2.5" />{STATUS_LABEL[p.status]}</span>
          <span className="font-mono text-muted-foreground">{p.timer}</span>
          <div className="ml-auto flex gap-2">
            {(["in", "break", "out"] as const).map((s) => (
              <button key={s} onClick={() => p.setStatus(s)} className={`h-11 rounded-full px-5 text-sm ${p.status === s ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {s === "in" ? "Clock in" : s === "break" ? "Break" : "Clock out"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-8 text-xs uppercase tracking-widest text-muted-foreground">Up next</div>
        <div className="mt-2 divide-y divide-border">
          {p.tasks.slice(0, 4).map((t) => (
            <button key={t.id} onClick={() => p.toggleTask(t.id)} className="flex w-full items-center gap-4 py-3 text-left">
              <span className={`h-5 w-5 rounded-full border-2 ${t.done ? "border-primary bg-primary" : "border-muted-foreground"}`} />
              <span className={`flex-1 ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.title}</span>
              <span className="text-sm text-muted-foreground">{t.list} · {t.due}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
const Mini = ({ k, v }: { k: string; v: string }) => (
  <div><div className="text-xs text-muted-foreground">{k}</div><div className="text-xl font-medium">{v}</div></div>
);
