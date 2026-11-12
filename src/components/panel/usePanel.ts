import { useEffect, useState } from "react";
import { SAMPLE_TASKS, type WorkStatus } from "@/lib/panel-data";

export function usePanel() {
  const [status, setStatus] = useState<WorkStatus>("out");
  const [lights, setLights] = useState(true);
  const [preset, setPreset] = useState<string>("work");
  const [tasks, setTasks] = useState(SAMPLE_TASKS);
  const [now, setNow] = useState<Date | null>(null);
  const [shiftSec, setShiftSec] = useState(0);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (status !== "in") return;
    const t = setInterval(() => setShiftSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const time = now ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--:--";
  const date = now ? now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" }) : "";
  const h = Math.floor(shiftSec / 3600), m = Math.floor((shiftSec % 3600) / 60), s = shiftSec % 60;
  const timer = `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return {
    status, setStatus, lights, setLights, preset,
    setPreset: (p: string) => { setPreset(p); setLights(p !== "night" ? true : lights); },
    tasks, toggleTask: (id: string) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t))),
    time, date, timer,
  };
}
export type Panel = ReturnType<typeof usePanel>;
