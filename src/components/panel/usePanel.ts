import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SAMPLE_TASKS, type WorkStatus } from "@/lib/panel-data";
import { BREAK_STORAGE_KEY, type BreakKind } from "@/lib/break";
import { clockStateQuery } from "@/lib/rize.queries";
import { setClockState } from "@/lib/rize.functions";
import type { ClockAction, ClockState } from "@/lib/rize-session";

/** `sync` (design A) mirrors and drives Rize's live session; legacy designs stay local. */
export function usePanel({ sync = false }: { sync?: boolean } = {}) {
  const [status, setStatus] = useState<WorkStatus>("out");
  const [lights, setLights] = useState(true);
  const [preset, setPreset] = useState<string>("work");
  const [tasks, setTasks] = useState(SAMPLE_TASKS);
  const [now, setNow] = useState<Date | null>(null);
  const [shiftSec, setShiftSec] = useState(0);
  const [shiftStart, setShiftStart] = useState<number | null>(null);
  const [breakInfo, setBreakInfo] = useState<{ kind: BreakKind; startedAt: number } | null>(null);
  const [picking, setPicking] = useState(false);
  const qc = useQueryClient();
  const remote = useQuery({ ...clockStateQuery, enabled: sync });
  const sending = useRef(0);

  const applyLocal = (s: ClockState) => {
    setStatus(s.status);
    setShiftStart(s.status === "in" ? s.startedAt : null);
    setBreakInfo(s.status === "break" && s.kind ? { kind: s.kind, startedAt: s.startedAt ?? Date.now() } : null);
  };
  const mutation = useMutation({
    mutationFn: (action: ClockAction) => setClockState({ data: action }),
    onMutate: () => { sending.current++; },
    onSuccess: (s) => { qc.setQueryData(clockStateQuery.queryKey, s); },
    onError: () => { toast.error("Couldn't update Rize — showing Rize's current status."); },
    onSettled: () => { sending.current--; void qc.invalidateQueries({ queryKey: clockStateQuery.queryKey }); },
  });
  // Mirror Rize unless a tap is still being sent (so the optimistic state doesn't flicker back).
  useEffect(() => { if (sync && remote.data && sending.current === 0) applyLocal(remote.data); }, [sync, remote.data]);

  useEffect(() => {
    if (sync) return;
    try {
      const saved = JSON.parse(localStorage.getItem(BREAK_STORAGE_KEY) ?? "null");
      if (saved?.kind && typeof saved.startedAt === "number") { setBreakInfo(saved); setStatus("break"); }
    } catch { /* ignore */ }
  }, [sync]);
  const changeStatus = (s: WorkStatus) => {
    setPicking(false);
    if (s === "break") return;
    applyLocal({ status: s, kind: null, startedAt: s === "in" ? Date.now() : null });
    if (sync) mutation.mutate(s);
    else localStorage.removeItem(BREAK_STORAGE_KEY);
  };
  const startBreak = (kind: BreakKind) => {
    const info = { kind, startedAt: Date.now() };
    setPicking(false);
    applyLocal({ status: "break", ...info });
    if (sync) mutation.mutate(`break:${kind}`);
    else localStorage.setItem(BREAK_STORAGE_KEY, JSON.stringify(info));
  };

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (status !== "in" || shiftStart != null) return;
    const t = setInterval(() => setShiftSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [status, shiftStart]);

  const shown = shiftStart != null && now ? Math.max(0, Math.floor((now.getTime() - shiftStart) / 1000)) : shiftSec;
  const time = now ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--:--";
  const date = now ? now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" }) : "";
  const h = Math.floor(shown / 3600), m = Math.floor((shown % 3600) / 60), s = shown % 60;
  const timer = `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return {
    status, setStatus: changeStatus, lights,
    breakInfo, picking, openBreakPicker: () => setPicking(true), cancelBreakPicker: () => setPicking(false), startBreak,
    nowMs: now?.getTime() ?? 0, setLights, preset,
    setPreset: (p: string) => { setPreset(p); setLights(p !== "night" ? true : lights); },
    tasks, toggleTask: (id: string) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t))),
    time, date, timer,
  };
}
export type Panel = ReturnType<typeof usePanel>;
