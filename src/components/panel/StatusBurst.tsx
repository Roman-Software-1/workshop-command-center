import { useEffect, useRef, useState } from "react";
import { STATUS_LABEL, type WorkStatus } from "@/lib/panel-data";

// Full-screen color flash + label when the clock status changes (skips first load).
export function StatusBurst({ status, compact = false }: { status: WorkStatus; compact?: boolean }) {
  const first = useRef(true);
  const [n, setN] = useState(0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setN((x) => x + 1);
    setVisible(true);
  }, [status]);
  if (!visible) return null;
  return (
    <div key={n} data-compact={compact || undefined} onAnimationEnd={(event) => {
      if (event.target === event.currentTarget) setVisible(false);
    }} className="status-burst pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      {!compact && <div className="status-burst-ring" />}
      {!compact && <div className="status-burst-ring delay" />}
      <div className="status-burst-text font-mono text-6xl font-extrabold uppercase tracking-[0.2em]">{STATUS_LABEL[status]}</div>
    </div>
  );
}
