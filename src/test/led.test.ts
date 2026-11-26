import { describe, expect, it } from "vitest";
import {
  clampBrightness,
  clampSpeed,
  computeSyncStatus,
  DEFAULT_LED,
  deviceReportSchema,
  effectDurationMs,
  extractPresetState,
  isPresetModified,
  LED_EFFECTS,
  ledCss,
  ledStateSchema,
  PI_OFFLINE_AFTER_MS,
  resolveLedHS,
  type LedPreset,
  type LedReported,
} from "@/lib/led-schema";

const baseReported: LedReported = {
  appliedRevision: 3,
  bootId: "boot-1",
  controllerVersion: "1.0.0",
  status: "running",
  lastError: null,
  heartbeatAt: "2026-11-26T00:00:00.000Z",
};

describe("Bar counter LED state & sync rules", () => {
  it("clamps brightness to 0–100 and speed to 1–100", () => {
    expect(clampBrightness(-15)).toBe(0);
    expect(clampBrightness(50.4)).toBe(50);
    expect(clampBrightness(140)).toBe(100);
    expect(clampSpeed(0)).toBe(1);
    expect(clampSpeed(150)).toBe(100);
  });

  it("maps work status preset to green, orange, and red", () => {
    const green = resolveLedHS({ hue: 0, sat: 0, preset: "status", effect: "solid" }, "in");
    const orange = resolveLedHS({ hue: 0, sat: 0, preset: "status", effect: "solid" }, "break");
    const red = resolveLedHS({ hue: 0, sat: 0, preset: "status", effect: "solid" }, "out");
    expect(green.hue).toBe(142);
    expect(orange.hue).toBe(32);
    expect(red.hue).toBe(4);
    expect(ledCss({ hue: 0, sat: 0, preset: "status", effect: "solid" }, "in")).toContain("142");
  });

  it("only reports Applied after the Pi confirms the latest revision while online", () => {
    const now = Date.parse("2026-11-26T00:00:10.000Z");
    expect(computeSyncStatus(3, baseReported, false, now).status).toBe("applied");
    expect(computeSyncStatus(4, baseReported, false, now).status).toBe("sending");
    expect(computeSyncStatus(3, baseReported, true, now).status).toBe("sending");
    expect(computeSyncStatus(3, baseReported, false, now + PI_OFFLINE_AFTER_MS).status).toBe("offline");
    expect(computeSyncStatus(3, { ...baseReported, lastError: "GPIO busy" }, false, now).status).toBe("error");
  });

  it("validates LED state and device report payloads and rejects invalid commands", () => {
    expect(ledStateSchema.safeParse(DEFAULT_LED).success).toBe(true);
    expect(ledStateSchema.safeParse({ ...DEFAULT_LED, effect: "exec_cmd" }).success).toBe(false);
    expect(ledStateSchema.safeParse({ ...DEFAULT_LED, brightness: 200 }).success).toBe(false);
    expect(deviceReportSchema.safeParse({ appliedRevision: 2, bootId: "b1", controllerVersion: "1.0.0", status: "running" }).success).toBe(true);
    expect(deviceReportSchema.safeParse({ appliedRevision: -1, bootId: "", controllerVersion: "1.0.0", status: "running" }).success).toBe(false);
  });

  it("detects preset modifications and supports all 9 effects", () => {
    expect(LED_EFFECTS.length).toBe(9);
    expect(effectDurationMs(100)).toBeLessThan(effectDurationMs(1));
    const preset: LedPreset = { id: "rainbow", label: "Rainbow", state: extractPresetState(DEFAULT_LED), custom: false };
    expect(isPresetModified(DEFAULT_LED, preset)).toBe(false);
    expect(isPresetModified({ ...DEFAULT_LED, speed: 90 }, preset)).toBe(true);
  });
});
