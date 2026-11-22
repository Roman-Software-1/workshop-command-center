export type BreakKind = "bathroom" | "coffee" | "general";
export const BREAK_LABEL: Record<BreakKind, string> = { bathroom: "Bathroom", coffee: "Coffee", general: "General" };
export const BREAK_STORAGE_KEY = "workshop-break";

/** Elapsed break time as m:ss, or h:mm:ss after an hour. */
export function fmtBreak(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
