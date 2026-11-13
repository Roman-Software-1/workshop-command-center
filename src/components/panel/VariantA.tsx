import { VerticalSwitch } from "./VerticalSwitch";
import { MONTH, RIZE, WEEK, WEEK_GOAL, STATUS_LABEL, TODAY, fmtMin } from "@/lib/panel-data";
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
            <div className="pointer-events-none"><VerticalSwitch on={p.lights} onToggle={() => {}} large decorative /></div>
            <LightBank className={p.lights ? "opacity-100" : "opacity-30"} />
          </button>
        </section>

        <section className="flex min-h-0 flex-col">
          {/* Hero: clock + hours worked */}
          <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
            <div className="px-6 py-3">
              <Label>Hours worked</Label>
              <div className="font-mono text-5xl font-extrabold leading-none">{fmtMin(TODAY.hoursWorkedMin)}</div>
              <div className="mt-2 font-mono text-base text-muted-foreground">
                Break <span className="text-[var(--status-break)]">{fmtMin(TODAY.breakMin)}</span>
              </div>
            </div>
            <div className="px-6 py-3">
              <div className="font-mono text-4xl font-extrabold leading-none">{p.time}</div>
              <div className="mt-2 text-sm text-muted-foreground">{p.date}</div>
              <div className="mt-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-primary">
                <IndicatorLight className="h-2 w-2" />
                {STATUS_LABEL[p.status]} · <span className="text-foreground">{p.timer}</span>
              </div>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-3 border-b border-border p-3">
            {(["in", "break", "out"] as const).map((s) => (
              <button key={s} onClick={() => p.setStatus(s)} style={{ "--c": `var(--status-${s})` } as React.CSSProperties} className={`h-12 rounded-md border-2 font-mono text-base uppercase transition-all active:scale-95 ${p.status === s ? "border-[var(--c)] bg-[var(--c)] text-primary-foreground shadow-[0_0_20px_-2px_var(--c)]" : "border-[var(--c)]/40 text-[var(--c)]"}`}>
                {s === "in" ? "Clock in" : s === "break" ? "Break" : "Clock out"}
              </button>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[1fr_250px] divide-x divide-border">
          <div className="flex min-h-0 flex-col pl-6 pr-4 pt-4 pb-3">
            <div className="flex items-baseline justify-between">
              <Label>This week · hours</Label>
              <span className="font-mono text-xs text-muted-foreground">{WEEK.reduce((t, d) => t + (d.h ?? 0), 0).toFixed(1)}h / {WEEK_GOAL * WEEK.length}h goal</span>
            </div>
            <WeekChart />
          </div>
            <MonthHeatmap />
          </div>

          <div className="grid shrink-0 grid-cols-4 border-t border-border font-mono">
            <Gauge k="Tasks" v={`${TODAY.tasksDone}/${TODAY.tasksTotal}`} />
            <Gauge k="Focus time" v={fmtMin(TODAY.focusMin)} />
            <Gauge k="Focus score" v={`${RIZE.focusScore}`} />
            <Gauge k={RIZE.topCategory} v={`${RIZE.topCategoryPct}%`} />
          </div>
          <div className="shrink-0 border-t border-border px-4 py-2"><SpotifyWidget /></div>
        </section>
      </div>
    </div>
  );
}
const Label = ({ children }: { children: React.ReactNode }) => <div className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">{children}</div>;
const Gauge = ({ k, v }: { k: string; v: string }) => (
  <div className="border-r border-border px-5 py-2 last:border-r-0"><div className="truncate text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{k}</div><div className="text-2xl font-extrabold">{v}</div></div>
);

function WeekChart() {
  const W = 480, H = 220, pad = 28, max = 10;
  const step = (W - pad * 2) / (WEEK.length - 1);
  const y = (h: number) => H - pad - (h / max) * (H - pad * 2);
  const pts = WEEK.flatMap((d, i) => (d.h == null ? [] : [[pad + i * step, y(d.h)] as const]));
  const line = pts.map(([x, yy], i) => `${i ? "L" : "M"}${x},${yy}`).join(" ");
  const last = pts[pts.length - 1];
  const area = last ? `${line} L${last[0]},${H - pad} L${pad},${H - pad} Z` : "";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="min-h-0 w-full flex-1">
      <defs>
        <linearGradient id="wk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--status-in)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--status-in)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 4, 8].map((g) => (
        <g key={g}>
          <line x1={pad} x2={W - pad} y1={y(g)} y2={y(g)} stroke="var(--border)" />
          <text x={4} y={y(g) + 4} fontSize="11" fill="var(--muted-foreground)" fontFamily="monospace">{g}</text>
        </g>
      ))}
      <line x1={pad} x2={W - pad} y1={y(WEEK_GOAL)} y2={y(WEEK_GOAL)} stroke="var(--status-break)" strokeDasharray="6 6" />
      <path d={area} fill="url(#wk)" />
      <path d={line} fill="none" stroke="var(--status-in)" strokeWidth="3" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {WEEK.map((d, i) => (
        <g key={d.day}>
          {d.h != null && <circle cx={pad + i * step} cy={y(d.h)} r={i === pts.length - 1 ? 6 : 4} fill={i === pts.length - 1 ? "var(--status-in)" : "var(--background)"} stroke="var(--status-in)" strokeWidth="2" />}
          <text x={pad + i * step} y={H - 6} textAnchor="middle" fontSize="12" fill={d.h == null ? "var(--muted-foreground)" : "var(--foreground)"} fontFamily="monospace">{d.day}</text>
        </g>
      ))}
    </svg>
  );
}

function MonthHeatmap() {
  const first = new Date(MONTH.year, MONTH.month, 1).getDay(); // 0=Sun
  const lead = (first + 6) % 7; // Monday-first
  const cells: (number | null | undefined)[] = [...Array(lead).fill(undefined), ...MONTH.hours];
  const level = (h: number | null | undefined) =>
    h == null ? 0 : h === 0 ? 0.08 : h < 4 ? 0.3 : h < 7 ? 0.55 : h < 9 ? 0.8 : 1;
  const total = MONTH.hours.reduce<number>((t, h) => t + (h ?? 0), 0);
  return (
    <div className="flex min-h-0 flex-col px-4 pt-3 pb-2">
      <Label>{MONTH.label}</Label>
      <div className="mb-2 font-mono text-xs text-muted-foreground">{total.toFixed(0)}h logged</div>
      <div className="grid w-[148px] shrink-0 self-center grid-cols-7 gap-1 font-mono text-[10px] text-muted-foreground">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i} className="text-center">{d}</div>)}
        {cells.map((h, i) => (
          <div
            key={i}
            title={h != null ? `${h}h` : undefined}
            className={`aspect-square rounded-[4px] ${h === undefined ? "" : "border border-border"}`}
            style={h === undefined ? undefined : { background: h === null ? "transparent" : `color-mix(in oklch, var(--status-in) ${level(h) * 100}%, transparent)` }}
          />
        ))}
      </div>
      <div className="mt-auto flex items-center justify-end gap-1 pt-2 font-mono text-[10px] text-muted-foreground">
        Less
        {[0.08, 0.3, 0.55, 0.8, 1].map((l) => (
          <span key={l} className="h-3 w-3 rounded-[3px]" style={{ background: `color-mix(in oklch, var(--status-in) ${l * 100}%, transparent)` }} />
        ))}
        More
      </div>
    </div>
  );
}
