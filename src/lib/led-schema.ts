import { z } from "zod";
import type { WorkStatus } from "./panel-data";

export const LED_DEVICE_ID = "bar-counter";
export const LED_SCHEMA_VERSION = 1;
export const PI_OFFLINE_AFTER_MS = 30_000;

export const LED_EFFECT_VALUES = [
  "solid",
  "rgb_white",
  "rainbow",
  "chase",
  "ocean",
  "amber",
  "comet",
  "scanner",
  "fire",
] as const;

export type LedEffect = (typeof LED_EFFECT_VALUES)[number];

export const LED_EFFECTS: readonly { id: LedEffect; label: string }[] = [
  { id: "solid", label: "Solid" },
  { id: "rgb_white", label: "RGB White" },
  { id: "rainbow", label: "Rainbow" },
  { id: "chase", label: "Chase" },
  { id: "ocean", label: "Ocean" },
  { id: "amber", label: "Amber" },
  { id: "comet", label: "Comet" },
  { id: "scanner", label: "Scanner" },
  { id: "fire", label: "Firelight" },
];

export const calibrationProbeSchema = z.object({
  indices: z.array(z.number().int().min(0).max(1999)).min(1).max(32),
  brightness: z.number().int().min(5).max(40).default(18),
});

export const ledStateSchema = z.object({
  on: z.boolean(),
  hue: z.number().min(0).max(360),
  sat: z.number().min(0).max(100),
  brightness: z.number().int().min(0).max(100),
  effect: z.enum(LED_EFFECT_VALUES),
  speed: z.number().int().min(1).max(100),
  direction: z.union([z.literal(1), z.literal(-1)]).default(1),
  spacing: z.number().int().min(4).max(200).default(48),
  chaseWidth: z.number().int().min(1).max(40).default(8),
  breathing: z.boolean().default(false),
  breathPeriodSec: z.number().min(2).max(20).default(8),
  breathMin: z.number().int().min(0).max(100).default(55),
  breathMax: z.number().int().min(1).max(100).default(100),
  transitionMs: z.number().int().min(0).max(3000).default(400),
  paused: z.boolean().default(false),
  preset: z.string().max(64).nullable().default(null),
  calibrationProbe: calibrationProbeSchema.nullable().optional(),
});

export type LedState = z.infer<typeof ledStateSchema>;

export const DEFAULT_LED: LedState = {
  on: true,
  hue: 0,
  sat: 95,
  brightness: 85,
  effect: "rainbow",
  speed: 45,
  direction: 1,
  spacing: 48,
  chaseWidth: 8,
  breathing: true,
  breathPeriodSec: 8,
  breathMin: 55,
  breathMax: 100,
  transitionMs: 400,
  paused: false,
  preset: "rainbow",
};

export type LedPreset = {
  id: string;
  label: string;
  state: Omit<LedState, "on" | "paused" | "preset" | "calibrationProbe">;
  swatch?: string | null;
  custom: boolean;
};

export type LedDeviceInfo = {
  id: string;
  name: string;
  hasToken: boolean;
  tokenPrefix: string | null;
  groupCount: number;
  groupCountProvisional: boolean;
  direction: 1 | -1;
};

export type LedReported = {
  appliedRevision: number;
  bootId: string | null;
  controllerVersion: string | null;
  status: string;
  lastError: string | null;
  heartbeatAt: string | null;
};

export type LedSnapshot = {
  device: LedDeviceInfo;
  desired: {
    schemaVersion: number;
    revision: number;
    state: LedState;
    updatedAt: string;
  };
  reported: LedReported;
  presets: LedPreset[];
};

export type LedSyncStatus = "sending" | "applied" | "offline" | "error";

export function computeSyncStatus(
  desiredRevision: number,
  reported: LedReported,
  pendingSend: boolean,
  nowMs = Date.now(),
): { status: LedSyncStatus; detail: string } {
  if (reported.lastError) return { status: "error", detail: reported.lastError };
  const hbMs = reported.heartbeatAt ? Date.parse(reported.heartbeatAt) : NaN;
  const online = Number.isFinite(hbMs) && nowMs - hbMs <= PI_OFFLINE_AFTER_MS;
  if (!online) return { status: "offline", detail: "Pi not seen in last 30s" };
  if (pendingSend || reported.appliedRevision < desiredRevision) {
    return { status: "sending", detail: `Waiting for rev ${desiredRevision}` };
  }
  return { status: "applied", detail: `Applied rev ${reported.appliedRevision}` };
}

export const clampBrightness = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
export const clampSpeed = (v: number) => Math.max(1, Math.min(100, Math.round(v)));
export const effectDurationMs = (speed: number) => Math.round(4200 - (clampSpeed(speed) / 100) * 3600);

const STATUS_HS: Record<WorkStatus, { hue: number; sat: number }> = {
  in: { hue: 142, sat: 85 },
  break: { hue: 32, sat: 95 },
  out: { hue: 4, sat: 88 },
};

export function resolveLedHS(state: Pick<LedState, "hue" | "sat" | "preset" | "effect">, status: WorkStatus) {
  if (state.preset === "status") return STATUS_HS[status];
  if (state.effect === "rgb_white") return { hue: 38, sat: 12 };
  return { hue: ((Math.round(state.hue) % 360) + 360) % 360, sat: Math.max(0, Math.min(100, Math.round(state.sat))) };
}

export function ledCss(state: Pick<LedState, "hue" | "sat" | "preset" | "effect">, status: WorkStatus) {
  const { hue, sat } = resolveLedHS(state, status);
  const light = Math.round(52 + ((100 - sat) / 100) * 40);
  return `hsl(${hue} ${sat}% ${light}%)`;
}

export function isPresetModified(led: LedState, preset: LedPreset | undefined): boolean {
  if (!preset) return false;
  const s = preset.state;
  return (
    Math.round(led.hue) !== Math.round(s.hue) ||
    Math.round(led.sat) !== Math.round(s.sat) ||
    led.brightness !== s.brightness ||
    led.effect !== s.effect ||
    led.speed !== s.speed ||
    led.direction !== s.direction ||
    led.spacing !== s.spacing ||
    led.chaseWidth !== s.chaseWidth ||
    led.breathing !== s.breathing ||
    led.breathPeriodSec !== s.breathPeriodSec ||
    led.breathMin !== s.breathMin ||
    led.breathMax !== s.breathMax ||
    led.transitionMs !== s.transitionMs
  );
}

export function extractPresetState(led: LedState): LedPreset["state"] {
  return {
    hue: Math.round(led.hue),
    sat: Math.round(led.sat),
    brightness: clampBrightness(led.brightness),
    effect: led.effect,
    speed: clampSpeed(led.speed),
    direction: led.direction,
    spacing: led.spacing,
    chaseWidth: led.chaseWidth,
    breathing: led.breathing,
    breathPeriodSec: led.breathPeriodSec,
    breathMin: led.breathMin,
    breathMax: led.breathMax,
    transitionMs: led.transitionMs,
  };
}

export function normalizeLedState(raw: unknown): LedState {
  const parsed = ledStateSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_LED;
}

export const deviceReportSchema = z.object({
  appliedRevision: z.number().int().min(0),
  bootId: z.string().min(1).max(128),
  controllerVersion: z.string().min(1).max(64),
  status: z.enum(["running", "error", "stopping"]),
  lastError: z.string().max(500).nullable().optional(),
  capabilities: z.record(z.string(), z.unknown()).optional(),
  appliedState: ledStateSchema.optional(),
});

export type DeviceReportPayload = z.infer<typeof deviceReportSchema>;