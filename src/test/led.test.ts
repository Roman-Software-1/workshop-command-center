import { describe, expect, it } from "vitest";
import { clampBrightness, clampSpeed, effectDurationMs, LED_PRESETS, ledCss } from "@/lib/led";

describe("Bar counter LED helpers", () => {
  it("clamps brightness between 0 and 100", () => {
    expect(clampBrightness(-10)).toBe(0);
    expect(clampBrightness(140)).toBe(100);
    expect(clampBrightness(42.6)).toBe(43);
  });

  it("clamps speed and shortens animation duration as speed increases", () => {
    expect(clampSpeed(0)).toBe(1);
    expect(clampSpeed(150)).toBe(100);
    expect(effectDurationMs(100)).toBeLessThan(effectDurationMs(1));
  });

  it("includes animated scene presets", () => {
    expect(LED_PRESETS.find((p) => p.id === "fireplace")?.effect).toBe("fire");
    expect(LED_PRESETS.find((p) => p.id === "party")?.effect).toBe("party");
  });

  it("computes hsl color for custom hue/saturation", () => {
    expect(ledCss({ hue: 215, sat: 90, preset: null }, "out")).toBe("hsl(215 90% 56%)");
  });

  it("matches work status colors when Work status preset is active", () => {
    expect(ledCss({ hue: 0, sat: 0, preset: "status" }, "in")).toBe("hsl(142 85% 58%)");
    expect(ledCss({ hue: 0, sat: 0, preset: "status" }, "break")).toBe("hsl(32 95% 54%)");
    expect(ledCss({ hue: 0, sat: 0, preset: "status" }, "out")).toBe("hsl(4 88% 57%)");
  });
});