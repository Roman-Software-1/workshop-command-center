import type { BreakKind } from "./break";

export type ClockAction = "in" | "out" | `break:${BreakKind}`;
export type ClockState = { status: "in" | "out" | "break"; kind: BreakKind | null; startedAt: number | null };

export const BREAK_TITLE: Record<BreakKind, string> = { bathroom: "Bathroom break", coffee: "Coffee break", general: "Break" };

/** Lengths are seconds: 12h work, 2h break, so sessions last until you tap. What Rize should start for a screen action; null means stop only. */
export function sessionFor(action: ClockAction): { type: "focus" | "break"; title: string; length?: number } | null {
  if (action === "out") return null;
  if (action === "in") return { type: "focus", title: "Workshop", length: 43_200 };
  const kind = action.slice(6) as BreakKind;
  return { type: "break", title: BREAK_TITLE[kind], length: 7_200 };
}

/** Maps Rize's live session to the screen state, exposing only status, break kind and start time. */
export function clockStateFrom(s: { type: string; title: string | null; startTime: string; endTime: string } | null, now = Date.now()): ClockState {
  if (!s || Date.parse(s.endTime) <= now) return { status: "out", kind: null, startedAt: null };
  const startedAt = Date.parse(s.startTime);
  if (s.type !== "break") return { status: "in", kind: null, startedAt };
  const t = (s.title ?? "").toLowerCase();
  const kind: BreakKind = t.includes("bathroom") ? "bathroom" : t.includes("coffee") ? "coffee" : "general";
  return { status: "break", kind, startedAt };
}
