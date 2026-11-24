import type { CSSProperties } from "react";
import type { WorkStatus } from "@/lib/panel-data";
import { ledCss, type LedState } from "@/lib/led";

type LedPillProps = {
  led: LedState;
  status: WorkStatus;
  onClick: () => void;
};

export function LedPill({ led, status, onClick }: LedPillProps) {
  const color = ledCss(led, status);
  const active = led.on && led.brightness > 0;
  const fillOpacity = active ? 0.35 + (led.brightness / 100) * 0.65 : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Bar counter LEDs"
      data-on={active}
      style={{ "--led": color } as CSSProperties}
      className="led-pill group relative flex h-[80px] w-[34px] shrink-0 flex-col items-center justify-between rounded-full border p-1.5 transition-transform active:scale-95"
    >
      <span
        aria-hidden="true"
        className="led-pill-glow pointer-events-none absolute inset-1 rounded-full"
        style={{ opacity: fillOpacity }}
      />
      <span className="relative z-10 flex flex-1 flex-col items-center justify-evenly py-0.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full transition-colors"
            style={{
              background: active ? "var(--foreground)" : "var(--muted-foreground)",
              opacity: active ? 0.9 : 0.3,
            }}
          />
        ))}
      </span>
    </button>
  );
}