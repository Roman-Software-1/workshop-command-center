import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { WorkStatus } from "@/lib/panel-data";
import { StatusBurst } from "./StatusBurst";

const VARIANTS = [
  { to: "/a", label: "A" },
  { to: "/b", label: "B" },
  { to: "/c", label: "C" },
] as const;

// Fixed 1024x600 canvas with the status border.
export function Frame({ status, variant, children }: { status: WorkStatus; variant: string; children: ReactNode }) {
  return (
    <div className="panel-stage flex items-center justify-center stage-bg">
      <div
        data-status={status}
        data-variant={variant}
        className="panel-root status-frame relative h-[600px] w-[1024px] shrink-0 overflow-hidden rounded-xl bg-background font-sans text-foreground"
      >
        {children}
        <StatusBurst status={status} />
        <nav className="absolute right-3 top-2 z-10 flex gap-1 rounded-full bg-muted/80 p-1 text-xs">
          {VARIANTS.map((v) => (
            <Link key={v.to} to={v.to} className="rounded-full px-3 py-1 text-muted-foreground" activeProps={{ className: "rounded-full px-3 py-1 bg-primary text-primary-foreground" }}>
              {v.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
