import { Coffee, LogIn, LogOut, Power, Check } from "lucide-react";
import { PRESETS, RIZE, STATUS_LABEL, TODAY, fmtMin } from "@/lib/panel-data";
import type { Panel } from "./usePanel";

// B: Big tiles — chunky, glove-friendly.
export function VariantB({ p }: { p: Panel }) {
  return (
    <div className="grid h-full grid-cols-[1fr_1.15fr] gap-3 p-4">
      <div className="grid grid-rows-[1.3fr_auto_1fr] gap-3">
        <button onClick={() => p.setLights(!p.lights)} className={`flex flex-col items-center justify-center gap-2 rounded-3xl ${p.lights ? "bg-primary text-primary-foreground status-glow" : "bg-tile text-muted-foreground"}`}>
          <Power className="h-16 w-16" strokeWidth={2.5} />
          <span className="font-display text-3xl uppercase">Lights {p.lights ? "on" : "off"}</span>
        </button>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((x) => (
            <button key={x.id} onClick={() => p.setPreset(x.id)} className={`h-16 rounded-2xl text-base font-bold ${p.preset === x.id ? "bg-foreground text-background" : "bg-tile"}`}>{x.label}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat k="Hours" v={fmtMin(TODAY.hoursWorkedMin)} />
          <Stat k="Tasks" v={`${TODAY.tasksDone}/${TODAY.tasksTotal}`} />
          <Stat k="Focus" v={`${RIZE.focusScore}%`} />
        </div>
      </div>
      <div className="grid grid-rows-[auto_auto_1fr] gap-3">
        <div className="flex items-center justify-between rounded-3xl bg-tile px-6 py-4 pr-28">
          <div>
            <div className="font-display text-5xl">{p.time}</div>
            <div className="text-sm text-muted-foreground">{p.date}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold uppercase text-primary">{STATUS_LABEL[p.status]}</div>
            <div className="font-mono text-2xl font-bold">{p.timer}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([["in", "Clock in", LogIn], ["break", "Break", Coffee], ["out", "Clock out", LogOut]] as const).map(([s, l, I]) => (
            <button key={s} onClick={() => p.setStatus(s)} className={`flex h-16 items-center justify-center gap-2 rounded-2xl text-lg font-bold ${p.status === s ? "bg-primary text-primary-foreground" : "bg-tile"}`}>
              <I className="h-6 w-6" />{l}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 overflow-hidden">
          {p.tasks.slice(0, 4).map((t) => (
            <button key={t.id} onClick={() => p.toggleTask(t.id)} className="flex items-center gap-3 rounded-2xl bg-tile px-4 py-3 text-left">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${t.done ? "bg-primary text-primary-foreground" : "border-2 border-muted-foreground"}`}>{t.done && <Check className="h-5 w-5" />}</span>
              <span className={`flex-1 truncate text-lg font-semibold ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.title}</span>
              {t.priority === "urgent" && <span className="rounded-full bg-status-out px-2 py-0.5 text-xs font-bold text-background">URGENT</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
const Stat = ({ k, v }: { k: string; v: string }) => (
  <div className="flex flex-col justify-center rounded-2xl bg-tile px-4"><div className="text-xs font-bold uppercase text-muted-foreground">{k}</div><div className="font-display text-2xl">{v}</div></div>
);
