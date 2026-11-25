import { useEffect, useState } from "react";
import type { WorkStatus } from "./panel-data";

export type LedEffect = "solid" | "breathe" | "rainbow" | "chase" | "fire" | "party";

export type LedState = {
  on: boolean;
  hue: number;
  sat: number;
  brightness: number;
  effect: LedEffect;
  speed: number;
  preset: string | null;
};

export type LedPreset = {
  id: string;
  label: string;
  hue: number;
  sat: number;
  brightness: number;
  effect: LedEffect;
  speed: number;
  swatch?: string;
  custom?: boolean;
};

export const LED_STORAGE_KEY = "workshop-bar-led";
export const LED_PRESETS_STORAGE_KEY = "workshop-bar-led-presets";

export const LED_EFFECTS: readonly { id: LedEffect; label: string }[] = [
  { id: "solid", label: "Solid" },
  { id: "breathe", label: "Breathe" },
  { id: "rainbow", label: "Rainbow" },
  { id: "chase", label: "Chase" },
  { id: "fire", label: "Fire" },
  { id: "party", label: "Party" },
];

const EFFECT_IDS = new Set<string>(LED_EFFECTS.map((e) => e.id));

export const DEFAULT_LED: LedState = {
  on: true,
  hue: 38,
  sat: 45,
  brightness: 80,
  effect: "solid",
  speed: 50,
  preset: "workshop",
};

export const LED_PRESETS: readonly LedPreset[] = [
  { id: "workshop", label: "Workshop", hue: 38, sat: 40, brightness: 85, effect: "solid", speed: 50 },
  { id: "sunset", label: "Sunset", hue: 24, sat: 95, brightness: 75, effect: "breathe", speed: 35, swatch: "linear-gradient(135deg, hsl(14 95% 55%), hsl(42 95% 55%))" },
  { id: "fireplace", label: "Fireplace", hue: 18, sat: 95, brightness: 70, effect: "fire", speed: 60, swatch: "linear-gradient(135deg, hsl(4 92% 48%), hsl(38 98% 55%))" },
  { id: "ocean", label: "Ocean", hue: 200, sat: 88, brightness: 75, effect: "breathe", speed: 30, swatch: "linear-gradient(135deg, hsl(185 90% 50%), hsl(225 90% 55%))" },
  { id: "cyberpunk", label: "Cyberpunk", hue: 295, sat: 90, brightness: 90, effect: "chase", speed: 65, swatch: "linear-gradient(135deg, hsl(310 95% 58%), hsl(185 95% 52%))" },
  { id: "rainbow", label: "Rainbow", hue: 0, sat: 95, brightness: 85, effect: "rainbow", speed: 45, swatch: "conic-gradient(hsl(0 95% 55%), hsl(90 95% 55%), hsl(180 95% 55%), hsl(270 95% 55%), hsl(360 95% 55%))" },
  { id: "party", label: "Party", hue: 330, sat: 95, brightness: 100, effect: "party", speed: 80, swatch: "linear-gradient(135deg, hsl(330 95% 55%), hsl(55 95% 55%), hsl(190 95% 55%))" },
];

const STATUS_HS: Record<WorkStatus, { hue: number; sat: number }> = {
  in: { hue: 142, sat: 85 },
  break: { hue: 32, sat: 95 },
  out: { hue: 4, sat: 88 },
};

export const clampBrightness = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
export const clampSpeed = (v: number) => Math.max(1, Math.min(100, Math.round(v)));
export const effectDurationMs = (speed: number) => Math.round(4200 - (clampSpeed(speed) / 100) * 3600);

export function isPresetModified(led: LedState, preset: LedPreset | undefined): boolean {
  if (!preset) return false;
  return (
    Math.round(led.hue) !== Math.round(preset.hue) ||
    Math.round(led.sat) !== Math.round(preset.sat) ||
    led.brightness !== preset.brightness ||
    led.effect !== preset.effect ||
    led.speed !== preset.speed
  );
}

export function buildCustomPreset(name: string, led: LedState): LedPreset | null {
  const label = name.trim().slice(0, 24);
  if (!label) return null;
  return {
    id: `custom-${Date.now()}`,
    label,
    hue: Math.round(led.hue),
    sat: Math.round(led.sat),
    brightness: clampBrightness(led.brightness),
    effect: led.effect,
    speed: clampSpeed(led.speed),
    custom: true,
  };
}

export function resolveLedHS(state: Pick<LedState, "hue" | "sat" | "preset">, status: WorkStatus) {
  if (state.preset === "status") return STATUS_HS[status];
  return { hue: ((Math.round(state.hue) % 360) + 360) % 360, sat: Math.max(0, Math.min(100, Math.round(state.sat))) };
}

export function ledCss(state: Pick<LedState, "hue" | "sat" | "preset">, status: WorkStatus) {
  const { hue, sat } = resolveLedHS(state, status);
  const light = Math.round(52 + ((100 - sat) / 100) * 40);
  return `hsl(${hue} ${sat}% ${light}%)`;
}

export function useLed() {
  const [led, setLed] = useState<LedState>(DEFAULT_LED);
  const [presets, setPresets] = useState<LedPreset[]>(() => [...LED_PRESETS]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(LED_STORAGE_KEY) ?? "null");
      if (raw && typeof raw.on === "boolean" && typeof raw.hue === "number" && typeof raw.sat === "number") {
        setLed({
          on: raw.on,
          hue: raw.hue,
          sat: raw.sat,
          brightness: clampBrightness(typeof raw.brightness === "number" ? raw.brightness : DEFAULT_LED.brightness),
          effect: typeof raw.effect === "string" && EFFECT_IDS.has(raw.effect) ? (raw.effect as LedEffect) : DEFAULT_LED.effect,
          speed: clampSpeed(typeof raw.speed === "number" ? raw.speed : DEFAULT_LED.speed),
          preset: typeof raw.preset === "string" ? raw.preset : null,
        });
      }
      const savedPresets = JSON.parse(localStorage.getItem(LED_PRESETS_STORAGE_KEY) ?? "null");
      if (Array.isArray(savedPresets) && savedPresets.length > 0) {
        setPresets(savedPresets);
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(LED_STORAGE_KEY, JSON.stringify(led));
      localStorage.setItem(LED_PRESETS_STORAGE_KEY, JSON.stringify(presets));
    } catch { /* ignore */ }
  }, [led, presets, loaded]);

  const setColor = (hue: number, sat: number) =>
    setLed((s) => ({ ...s, on: true, hue, sat, preset: s.preset === "status" ? null : s.preset }));

  const applyPreset = (id: string) => {
    if (id === "status") {
      setLed((s) => ({ ...s, on: true, effect: "solid", preset: "status" }));
      return;
    }
    const p = presets.find((x) => x.id === id);
    if (p) setLed((s) => ({ ...s, on: true, hue: p.hue, sat: p.sat, brightness: p.brightness, effect: p.effect, speed: p.speed, preset: p.id }));
  };

  const setBrightness = (v: number) =>
    setLed((s) => ({ ...s, brightness: clampBrightness(v) }));

  const setEffect = (effect: LedEffect) =>
    setLed((s) => ({ ...s, on: true, effect, preset: s.preset === "status" ? null : s.preset }));

  const setSpeed = (v: number) =>
    setLed((s) => ({ ...s, speed: clampSpeed(v) }));

  const savePreset = (name: string) => {
    const created = buildCustomPreset(name, led);
    if (!created) return false;
    setPresets((list) => [...list, created]);
    setLed((s) => ({ ...s, preset: created.id }));
    return true;
  };

  const updatePreset = (id: string) => {
    setPresets((list) =>
      list.map((p) => {
        if (p.id !== id) return p;
        const { swatch: _, ...rest } = p;
        return { ...rest, hue: Math.round(led.hue), sat: Math.round(led.sat), brightness: led.brightness, effect: led.effect, speed: led.speed };
      }),
    );
  };

  const deletePreset = (id: string) => {
    setPresets((list) => list.filter((p) => p.id !== id));
    setLed((s) => (s.preset === id ? { ...s, preset: null } : s));
  };

  const toggle = () => setLed((s) => ({ ...s, on: !s.on }));

  return { led, presets, setColor, applyPreset, setBrightness, setEffect, setSpeed, savePreset, updatePreset, deletePreset, toggle };
}