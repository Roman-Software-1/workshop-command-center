import { LOCATION } from "./panel-data";

export type RizeBucket = { date: string; workHours: number; focusTime: number; breakTime: number; meetingTime: number };
export type RizeMetrics = {
  today: { hoursWorkedMin: number; focusMin: number; breakMin: number; meetingMin: number };
  week: { day: string; h: number | null }[];
  month: { label: string; year: number; month: number; hours: (number | null)[] };
  weekHours: number;
  monthHours: number;
};
export type RizeResult = { metrics: RizeMetrics | null; updatedAt: string | null; error: string | null };

export function workshopDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: LOCATION.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (name: string) => parts.find((p) => p.type === name)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
// UTC instant of local midnight in the workshop time zone (handles DST).
export function workshopMidnightUtc(date: string): string {
  for (const off of [4, 5, 6, 3]) {
    const t = new Date(`${date}T${String(off).padStart(2, "0")}:00:00Z`);
    const h = new Intl.DateTimeFormat("en-US", { timeZone: LOCATION.timeZone, hour: "2-digit", hourCycle: "h23" }).format(t);
    if (workshopDate(t) === date && Number(h) === 0) return t.toISOString();
  }
  return new Date(`${date}T05:00:00Z`).toISOString();
}
export function rizeDateRange(now: Date) {
  const today = workshopDate(now);
  const monthStart = `${today.slice(0, 7)}-01`;
  const rollingStart = shiftDate(today, -6);
  return { today, start: rollingStart < monthStart ? rollingStart : monthStart, end: today };
}

// Only explicit aggregate fields cross the public boundary; never spread provider objects.
// `tracked` = seconds per local date from Rize's Tracked page (time entries); it drives hours when given.
export function publicRizeMetrics(buckets: RizeBucket[], today: string, tracked?: Map<string, number>): RizeMetrics {
  const byDate = new Map(buckets.map((b) => [b.date.slice(0, 10), b]));
  const seconds = (n: number | undefined) => typeof n === "number" && Number.isFinite(n) ? Math.max(0, n) : 0;
  const workSeconds = (date: string) => seconds(tracked ? tracked.get(date) : byDate.get(date)?.workHours);
  const hours = (date: string) => workSeconds(date) / 3600;
  const current = byDate.get(today);
  const d = new Date(`${today}T12:00:00Z`);
  const year = d.getUTCFullYear(), month = d.getUTCMonth();
  const sinceMonday = (d.getUTCDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = shiftDate(today, i - 6);
    return { day: i === 6 ? "Today" : new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)), h: hours(date) };
  });
  const monthHours = Array.from({ length: new Date(Date.UTC(year, month + 1, 0)).getUTCDate() }, (_, i) => {
    const date = `${today.slice(0, 7)}-${String(i + 1).padStart(2, "0")}`;
    return date > today ? null : hours(date);
  });
  return {
    today: { hoursWorkedMin: Math.floor(workSeconds(today) / 60), focusMin: Math.floor(seconds(current?.focusTime) / 60), breakMin: Math.floor(seconds(current?.breakTime) / 60), meetingMin: Math.floor(seconds(current?.meetingTime) / 60) },
    week,
    month: { label: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(d), year, month, hours: monthHours },
    weekHours: week.slice(6 - sinceMonday).reduce((sum, b) => sum + (b.h ?? 0), 0),
    monthHours: monthHours.reduce<number>((sum, h) => sum + (h ?? 0), 0),
  };
}