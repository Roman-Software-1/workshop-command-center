// Sample data. Shapes mirror what ClickUp / Rize will provide later.
export type WorkStatus = "in" | "break" | "out";
export type Task = { id: string; title: string; list: string; due: string; priority: "urgent" | "high" | "normal"; done: boolean };

export const PRESETS = [
  { id: "work", label: "Work" },
  { id: "detail", label: "Detail" },
  { id: "clean", label: "Clean-up" },
  { id: "night", label: "Night" },
] as const;

export const SAMPLE_TASKS: Task[] = [
  { id: "1", title: "Finish walnut table glue-up", list: "Builds", due: "Today", priority: "urgent", done: false },
  { id: "2", title: "Sand + finish cabinet doors", list: "Builds", due: "Today", priority: "high", done: false },
  { id: "3", title: "Order 3/4\" birch ply", list: "Supplies", due: "Tomorrow", priority: "high", done: false },
  { id: "4", title: "Invoice Henderson job", list: "Admin", due: "Fri", priority: "normal", done: false },
  { id: "5", title: "Sharpen planer blades", list: "Shop", due: "Fri", priority: "normal", done: true },
];

export const TODAY = { hoursWorkedMin: 312, tasksDone: 7, tasksTotal: 12, focusMin: 220, breakMin: 35 };
export const RIZE = { focusScore: 82, breaks: 3, topCategory: "Fabrication", topCategoryPct: 46 };

export const STATUS_LABEL: Record<WorkStatus, string> = { in: "Clocked in", break: "On break", out: "Clocked out" };

export function fmtMin(m: number) {
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

// Sample weekly hours (null = day not reached yet).
export const WEEK_GOAL = 8;
export const WEEK: { day: string; h: number | null }[] = [
  { day: "Mon", h: 7.5 }, { day: "Tue", h: 8.6 }, { day: "Wed", h: 6.2 },
  { day: "Thu", h: 9.1 }, { day: "Fri", h: 5.2 }, { day: "Sat", h: null }, { day: "Sun", h: null },
];

// Sample month of hours (null = future day).
const MONTH_SAMPLE = [7.5, 0, 0, 8.2, 6.4, 9.1, 7.8, 3.5, 0, 7.5, 8.6, 6.2, 5.2];
export const MONTH = {
  label: "November 2026",
  year: 2026,
  month: 10,
  hours: Array.from({ length: 30 }, (_, i) => MONTH_SAMPLE[i] ?? null) as (number | null)[],
};
