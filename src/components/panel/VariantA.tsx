import { useEffect, useState } from "react";
import { daylightFor, minutesInZone, type DayLight } from "@/lib/sun";
import { heatColor, LOCATION, MONTH_TARGET_H, WEEK_TARGET_H, WEEK_GOAL, STATUS_LABEL, fmtMin } from "@/lib/panel-data";
import { publicRizeMetrics, workshopDate, type RizeMetrics, type RizeResult } from "@/lib/rize-summary";
import type { Panel } from "./usePanel";
import { IndicatorLight } from "./IndicatorLights";
import { SpotifyWidget } from "./SpotifyWidget";
import { AccountButton } from "@/components/account/AccountButton";
import { BreakOverlay, BreakPicker } from "./BreakOverlay";
import { BREAK_LABEL } from "@/lib/break";
import { useLed } from "@/lib/led";
import { LedPill } from "./LedPill";
import { LedModal } from "./LedModal";

// A: Instrument panel — thin rules, mono numerals, gauge feel.
export function VariantA({ p, rize }: { p: Panel; rize: RizeResult }) {
  const { led, setColor, applyPreset, setBrightness, setEffect, setSpeed, toggle } = useLed();
  const [ledOpen, setLedOpen] = useState(false);
  // No sample numbers on the connected display, including during outages.
  const empty = publicRizeMetrics([], workshopDate(new Date()));
  const metrics = rize.metrics;
  const week = metrics?.week ?? empty.week.map((d) => ({ ...d, h: null }));
  const month = metrics?.month ?? { ...empty.month, hours: empty.month.hours.map(() => null) };
  const minutes = (value: number | undefined) => value === undefined ? "—" : fmtMin(value);
  return (
    <div className="flex h-full">
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <section className="flex min-h-0 flex-1 flex-col">
          {/* Hero: clock + hours worked */}
          <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
            <div className="flex items-center gap-4 px-5 py-2.5">
              <div className="flex flex-1 flex-col items-center text-center">
                <Label>Hours worked · <span title={rize.updatedAt ? `Updated ${rize.updatedAt}` : undefined}>{rize.error ? "Rize offline" : "Rize"}</span></Label>
                <div className="font-mono text-6xl font-extrabold leading-none">{minutes(metrics?.today.hoursWorkedMin)}</div>
                <div className="mt-2 font-mono text-base text-muted-foreground">
                  Break <span className="text-[var(--status-break)]">{minutes(metrics?.today.breakMin)}</span>
                </div>
              </div>
              <div className="flex w-[150px] shrink-0 flex-col gap-2">
                <ProgressTile label="Week" value={metrics?.weekHours} goal={WEEK_TARGET_H} />
                <ProgressTile label="Month" value={metrics?.monthHours} goal={MONTH_TARGET_H} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-2.5">
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="font-mono text-4xl font-extrabold leading-none">{p.time}</div>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">{p.date}<AccountButton /></div>
                <div className="mt-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-primary">
                  <IndicatorLight className="h-2 w-2" />
                  {STATUS_LABEL[p.status]}{p.status === "break" && p.breakInfo ? ` · ${BREAK_LABEL[p.breakInfo.kind]}` : ""} · <span className="text-foreground">{p.timer}</span>
                </div>
              </div>
              <LedPill led={led} status={p.status} onClick={() => setLedOpen(true)} />
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-3 border-b border-border px-3 py-2">
            {(["in", "break", "out"] as const).map((s) => (
              <button key={s} onClick={() => (s === "break" ? p.openBreakPicker() : p.setStatus(s))} style={{ "--c": `var(--status-${s})` } as React.CSSProperties} className={`h-11 rounded-md border-2 font-mono text-base uppercase transition-all active:scale-95 ${p.status === s ? "border-[var(--c)] bg-[var(--c)] text-primary-foreground shadow-[0_0_20px_-2px_var(--c)]" : "border-[var(--c)]/40 text-[var(--c)]"}`}>
                {s === "in" ? "Clock in" : s === "break" ? "Break" : "Clock out"}
              </button>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[1fr_360px] divide-x divide-border border-b border-border">
          <div className="flex min-h-0 flex-col px-6 pt-3 pb-2">
            <div className="flex items-baseline justify-between">
              <Label>Last 7 days · hours</Label>
              <span className="font-mono text-xs text-muted-foreground">{metrics ? `${week.reduce((t, d) => t + (d.h ?? 0), 0).toFixed(1)}h` : "—"} / {WEEK_GOAL * week.length}h goal</span>
            </div>
            <WeekChart week={week} />
          </div>
            <MonthHeatmap month={month} available={metrics !== null} />
          </div>

          <div className="grid shrink-0 grid-cols-4 border-b border-border font-mono">
            <Gauge k="Tasks" v="—" />
            <Gauge k="Focus time" v={minutes(metrics?.today.focusMin)} />
            <Gauge k="Focus score" v="—" />
            <Gauge k="Meeting time" v={minutes(metrics?.today.meetingMin)} />
          </div>
          <div className="shrink-0 px-4 py-2"><SpotifyWidget /></div>
        </section>
      </div>
    </div>
    <div className="flex w-[84px] shrink-0 border-l border-border px-2 py-3"><DaylightBar /></div>
    {p.picking && <BreakPicker onPick={p.startBreak} onCancel={p.cancelBreakPicker} />}
    {p.status === "break" && p.breakInfo && !p.picking && (
      <BreakOverlay kind={p.breakInfo.kind} startedAt={p.breakInfo.startedAt} now={Math.max(p.nowMs, p.breakInfo.startedAt)} onResume={() => p.setStatus("in")} onClockOut={() => p.setStatus("out")} />
    )}
    {ledOpen && (
      <LedModal
        led={led}
        status={p.status}
        onColor={setColor}
        onPreset={applyPreset}
        onBrightness={setBrightness}
        onEffect={setEffect}
        onSpeed={setSpeed}
        onToggle={toggle}
        onClose={() => setLedOpen(false)}
      />
    )}
    </div>
  );
}
const Label = ({ children }: { children: React.ReactNode }) => <div className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">{children}</div>;
function ProgressTile({ label, value, goal }: { label: string; value: number | undefined; goal: number }) {
  const pct = Math.min(100, ((value ?? 0) / goal) * 100);
  const done = value !== undefined && value >= goal;
  return (
    <div className="relative overflow-hidden rounded-md border border-border bg-[var(--tile-raised)] py-1.5 pl-3 pr-2.5 font-mono">
      <span className="absolute inset-y-0 left-0 w-[3px] bg-[var(--status-in)] shadow-[0_0_8px_var(--status-in)]" />
      <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--status-in)]">{label}</div>
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-extrabold leading-tight">{value === undefined ? "—" : `${value.toFixed(1)}h`}</span>
        <span className="text-[10px] text-muted-foreground">of {goal}h</span>
      </div>
      <div className="mt-1 h-1 rounded-full bg-muted">
        <div className="h-full rounded-full bg-[var(--status-in)]" style={{ width: `${pct}%`, filter: done ? "brightness(1.3)" : undefined }} />
      </div>
    </div>
  );
}
const Gauge = ({ k, v }: { k: string; v: string }) => (
  <div className="border-r border-border px-5 py-1.5 last:border-r-0"><div className="truncate text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{k}</div><div className="text-2xl font-extrabold">{v}</div></div>
);

function WeekChart({ week }: { week: RizeMetrics["week"] }) {
  const W = 620, H = 200, pad = 26, max = Math.max(10, ...week.map((d) => d.h ?? 0));
  const step = (W - pad * 2) / (week.length - 1);
  const y = (h: number) => H - pad - (h / max) * (H - pad * 2);
  const pts = week.flatMap((d, i) => (d.h == null ? [] : [[pad + i * step, y(d.h)] as const]));
  const line = pts.map(([x, yy], i) => `${i ? "L" : "M"}${x},${yy}`).join(" ");
  const last = pts[pts.length - 1];
  const area = last ? `${line} L${last[0]},${H - pad} L${pad},${H - pad} Z` : "";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="min-h-0 w-full flex-1">
      <defs>
        <linearGradient id="wk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--status-in)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--status-in)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, max / 2, max].map((g) => (
        <g key={g}>
          <line x1={pad} x2={W - pad} y1={y(g)} y2={y(g)} stroke="var(--border)" />
          <text x={4} y={y(g) + 4} fontSize="11" fill="var(--muted-foreground)" fontFamily="monospace">{g.toFixed(0)}</text>
        </g>
      ))}
      <line x1={pad} x2={W - pad} y1={y(WEEK_GOAL)} y2={y(WEEK_GOAL)} stroke="var(--status-break)" strokeDasharray="6 6" />
      <path d={area} fill="url(#wk)" />
      <path d={line} fill="none" stroke="var(--status-in)" strokeWidth="3" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {week.map((d, i) => (
        <g key={d.day}>
          {d.h != null && <circle cx={pad + i * step} cy={y(d.h)} r={i === pts.length - 1 ? 6 : 4} fill={i === pts.length - 1 ? "var(--status-in)" : "var(--background)"} stroke="var(--status-in)" strokeWidth="2" />}
          <text x={pad + i * step} y={H - 6} textAnchor="middle" fontSize="12" fill={d.h == null ? "var(--muted-foreground)" : "var(--foreground)"} fontFamily="monospace">{d.day}</text>
        </g>
      ))}
    </svg>
  );
}

function MonthHeatmap({ month, available }: { month: RizeMetrics["month"]; available: boolean }) {
  const first = new Date(Date.UTC(month.year, month.month, 1)).getUTCDay(); // 0=Sun
  const lead = (first + 6) % 7; // Monday-first
  const cells: (number | null | undefined)[] = [...Array(lead).fill(undefined), ...month.hours];
  const total = month.hours.reduce<number>((t, h) => t + (h ?? 0), 0);
  return (
    <div className="flex min-h-0 gap-3 px-5 pt-3 pb-2">
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-baseline justify-between"><Label>{month.label}</Label><span className="font-mono text-xs text-muted-foreground">{available ? `${total.toFixed(0)}h` : "—"}</span></div>
      <div className="relative min-h-0 flex-1">
      <div className="absolute inset-y-0 left-1/2 grid h-full -translate-x-1/2 grid-cols-7 grid-rows-7 gap-1 [aspect-ratio:1.15] font-mono text-[10px] text-muted-foreground">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i} className="flex items-end justify-center leading-none">{d}</div>)}
        {cells.map((h, i) => (
          <div
            key={i}
            title={h != null ? `${month.label} ${i - lead + 1}: ${h.toFixed(1)}h` : undefined}
            className={`rounded-[4px] ${h === undefined ? "" : "border border-border"}`}
            style={h === undefined ? undefined : { background: h === null ? "transparent" : heatColor(h) }}
          />
        ))}
      </div>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-1 pt-1 font-mono text-[10px] text-muted-foreground">
        Less
        {[1, 2, 3, 4, 5].map((l) => (
          <span key={l} className="h-3 w-3 rounded-[3px]" style={{ background: `var(--heat-${l})` }} />
        ))}
        More
      </div>
    </div>
    </div>
  );
}

function DaylightBar() {
  const [now, setNow] = useState<number | null>(null);
  const [sun, setSun] = useState<DayLight | null>(null);
  useEffect(() => {
    const tick = () => { const d = new Date(); setNow(minutesInZone(d, LOCATION.timeZone)); setSun(daylightFor(d, LOCATION)); };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  const D = 1440;
  const k = sun ?? { nauticalDawn: 330, civilDawn: 380, sunrise: 410, sunset: 990, civilDusk: 1020, nauticalDusk: 1060 };
  const rise = k.sunrise, set = k.sunset;
  const segs: [number, number, string][] = [
    [0, k.nauticalDawn, "--sky-night"], [k.nauticalDawn, k.civilDawn, "--sky-astro"], [k.civilDawn, rise, "--sky-blue"],
    [rise, set, "--sky-day"],
    [set, k.civilDusk, "--sky-cyan"], [k.civilDusk, k.nauticalDusk, "--sky-dusk"], [k.nauticalDusk, D, "--sky-twilight"],
  ];
  const hm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
  const pc = (m: number) => `${(m / D) * 100}%`;
  return (
    <div className="flex w-full flex-col items-center font-mono">
      <div className="text-[9px] font-extrabold tracking-[0.2em] text-muted-foreground">DAYLIGHT</div>
      <div className="mt-0.5 text-base font-extrabold leading-none">{Math.floor((set - rise) / 60)}h{String((set - rise) % 60).padStart(2, "0")}</div>
      <div className="mt-0.5 text-[9px] leading-none text-muted-foreground">{hm(rise)}–{hm(set)}</div>
      <div className="my-1 text-xs leading-none text-[var(--sky-day)]">☀</div>
      <div className="flex min-h-0 w-full flex-1 gap-1.5">
        <div className="relative flex w-[30px] flex-col gap-[3px]">
          {segs.map(([a, b, c]) => {
            const past = c === "--sky-day" && now != null ? Math.max(0, Math.min(1, (now - a) / (b - a))) : 0;
            return (
              <div key={c} className="relative overflow-hidden rounded-[7px]" style={{ flexGrow: b - a, flexBasis: 0, background: `var(${c})` }}>
                {past > 0 && <div className="absolute inset-x-0 top-0 bg-background/55" style={{ height: `${past * 100}%` }} />}
              </div>
            );
          })}
          {now != null && (
            <div className="absolute -left-[5px] -translate-y-1/2" style={{ top: pc(now) }}>
              <div className="h-0 w-0 border-y-[4px] border-l-[6px] border-y-transparent border-l-foreground" />
            </div>
          )}
        </div>
        <div className="relative flex-1 text-[9px] font-bold text-muted-foreground">
          
          {[0, 4, 8, 12, 16, 20, 24].map((h) => <span key={h} className="absolute -translate-y-1/2 leading-none" style={{ top: pc(h * 60) }}>{String(h).padStart(2, "0")}</span>)}
          
        </div>
      </div>
      <div className="mt-1 text-xs leading-none text-[var(--sky-twilight)]">☾</div>
    </div>
  );
}
