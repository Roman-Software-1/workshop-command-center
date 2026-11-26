import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Check, Copy, Gauge, Pause, Pencil, Play, Plus, Power, Save, Sun, Trash2, X } from "lucide-react";
import type { WorkStatus } from "@/lib/panel-data";
import {
  effectDurationMs,
  isPresetModified,
  LED_EFFECTS,
  ledCss,
  resolveLedHS,
  type LedDeviceInfo,
  type LedPreset,
  type LedReported,
  type LedState,
  type LedSyncStatus,
} from "@/lib/led";
import { MUSIC_MODAL_IDLE_MS } from "@/lib/music-modal";
import { LedTuneTab } from "./LedTuneTab";
import { LedSetupTab } from "./LedSetupTab";

type LedModalProps = {
  led: LedState;
  presets: readonly LedPreset[];
  device: LedDeviceInfo | null;
  reported: LedReported;
  sync: { status: LedSyncStatus; detail: string };
  browserOffline: boolean;
  status: WorkStatus;
  onPatchImmediate: (patch: Partial<LedState>, force?: boolean) => void;
  onPatchDebounced: (patch: Partial<LedState>) => void;
  onFlush: () => void;
  onTurnOff: () => void;
  onPreset: (id: string) => void;
  onSavePreset: (name: string) => Promise<boolean>;
  onUpdatePreset: (id: string) => Promise<void>;
  onRenamePreset: (id: string, name: string) => Promise<void>;
  onDuplicatePreset: (id: string) => Promise<void>;
  onDeletePreset: (id: string) => Promise<void>;
  onRotateToken: () => Promise<{ token: string; tokenPrefix: string }>;
  onRevokeToken: () => Promise<void>;
  onSaveCalibration: (groupCount: number, direction: 1 | -1) => Promise<void>;
  onProbeCalibration: (indices: number[], brightness?: number) => void;
  onClose: () => void;
};

const SYNC_LABEL: Record<LedSyncStatus, string> = {
  sending: "Sending",
  applied: "Applied by controller",
  offline: "Offline",
  error: "Error",
};

export function LedModal({
  led,
  presets,
  device,
  reported,
  sync,
  browserOffline,
  status,
  onPatchImmediate,
  onPatchDebounced,
  onFlush,
  onTurnOff,
  onPreset,
  onSavePreset,
  onUpdatePreset,
  onRenamePreset,
  onDuplicatePreset,
  onDeletePreset,
  onRotateToken,
  onRevokeToken,
  onSaveCalibration,
  onProbeCalibration,
  onClose,
}: LedModalProps) {
  const [tab, setTab] = useState<"controls" | "tune" | "setup">("controls");
  const [saving, setSaving] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetIdle = useCallback(() => {
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(onClose, MUSIC_MODAL_IDLE_MS);
  }, [onClose]);

  useEffect(() => {
    resetIdle();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      if (idleRef.current) clearTimeout(idleRef.current);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, resetIdle]);

  const color = ledCss(led, status);
  const active = led.on && led.brightness > 0;
  const { hue, sat } = resolveLedHS(led, status);
  const dur = `${effectDurationMs(led.speed)}ms`;
  const effectLabel = LED_EFFECTS.find((e) => e.id === led.effect)?.label ?? "Solid";
  const animated = led.effect !== "solid" && led.effect !== "rgb_white";
  const selectedPreset = presets.find((p) => p.id === led.preset);
  const modified = isPresetModified(led, selectedPreset);

  const submitSave = async () => {
    if (await onSavePreset(draftName)) {
      setDraftName("");
      setSaving(false);
    }
  };

  const submitRename = async () => {
    if (!selectedPreset || !draftName.trim()) return;
    await onRenamePreset(selectedPreset.id, draftName);
    setDraftName("");
    setRenaming(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bar counter LEDs"
      className="music-scrim fixed inset-0 z-40 flex items-center justify-center p-4"
      onClick={onClose}
      onPointerDown={resetIdle}
    >
      <div
        className="music-card relative flex w-[840px] max-w-[96vw] flex-col gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-foreground">Bar LEDs</span>
            <span
              data-sync-status={browserOffline ? "error" : sync.status}
              title={browserOffline ? "Browser cannot reach backend" : sync.detail}
              className="rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-secondary-foreground"
            >
              {browserOffline ? "Backend unreachable" : SYNC_LABEL[sync.status]}
            </span>
          </div>
          <div className="flex flex-1 flex-col items-end gap-0.5">
            <div
              aria-hidden="true"
              data-on={active && !led.paused}
              data-effect={led.effect}
              className="led-strip h-3 w-full rounded-full border border-border transition-opacity"
              style={{
                "--led": color,
                "--led-dur": dur,
                opacity: active ? 0.35 + (led.brightness / 100) * 0.65 : 0.35,
              } as CSSProperties}
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              Preview, not live · {led.on ? `${led.brightness}% · ${effectLabel}` : "Off"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => { resetIdle(); led.on ? onTurnOff() : onPatchImmediate({ on: true }); }}
            className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 font-mono text-xs font-bold uppercase active:scale-95 ${
              led.on ? "border-destructive/60 bg-destructive text-destructive-foreground" : "border-foreground bg-foreground text-background"
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            {led.on ? "Off" : "Turn On"}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close LED controller"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-secondary-foreground active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-border pb-2">
          {(["controls", "tune", "setup"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { resetIdle(); setTab(t); }}
              className={`rounded-lg border px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.15em] active:scale-95 ${
                tab === t ? "border-foreground bg-foreground text-background" : "border-border bg-secondary/50 text-secondary-foreground"
              }`}
            >
              {t === "controls" ? "Controls" : t === "tune" ? "Tune" : "Setup"}
            </button>
          ))}
          {animated && (
            <button
              type="button"
              onClick={() => { resetIdle(); onPatchImmediate({ paused: !led.paused }); }}
              className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 py-1 font-mono text-[11px] uppercase text-secondary-foreground active:scale-95"
            >
              {led.paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {led.paused ? "Resume" : "Pause"}
            </button>
          )}
        </div>

        {tab === "tune" && (
          <LedTuneTab led={led} onPatchImmediate={(p) => { resetIdle(); onPatchImmediate(p); }} onPatchDebounced={(p) => { resetIdle(); onPatchDebounced(p); }} onFlush={onFlush} />
        )}

        {tab === "setup" && (
          <LedSetupTab
            device={device}
            reported={reported}
            onRotateToken={onRotateToken}
            onRevokeToken={onRevokeToken}
            onSaveCalibration={onSaveCalibration}
            onProbeCalibration={(indices, b) => { resetIdle(); onProbeCalibration(indices, b); }}
          />
        )}

        {tab === "controls" && (
        <>
        <div className="grid grid-cols-[180px_1fr] items-center gap-4">
          <ColorWheel hue={hue} sat={sat} onPick={(h, s) => { resetIdle(); onPatchDebounced({ on: true, hue: h, sat: s, preset: led.preset === "status" ? null : led.preset }); }} onRelease={onFlush} />

          <div className="flex flex-col gap-2.5">
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Scenes</span>
                <div className="flex items-center gap-1.5">
                  {selectedPreset && modified && (
                    <button
                      type="button"
                      onClick={() => { resetIdle(); void onUpdatePreset(selectedPreset.id); }}
                      className="flex items-center gap-1 rounded-md border border-foreground bg-secondary px-2 py-1 font-mono text-[10px] font-bold uppercase text-secondary-foreground active:scale-95"
                    >
                      <Save className="h-3 w-3" />
                      Update
                    </button>
                  )}
                  {selectedPreset && (
                    <button
                      type="button"
                      onClick={() => { resetIdle(); void onDuplicatePreset(selectedPreset.id); }}
                      aria-label={`Duplicate ${selectedPreset.label}`}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background/60 text-muted-foreground active:scale-95"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                  {selectedPreset?.custom && (
                    <>
                    <button
                      type="button"
                      onClick={() => { resetIdle(); setRenaming(true); setSaving(false); setDraftName(selectedPreset.label); }}
                      aria-label={`Rename ${selectedPreset.label}`}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background/60 text-muted-foreground active:scale-95"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { resetIdle(); void onDeletePreset(selectedPreset.id); }}
                      aria-label={`Delete ${selectedPreset.label}`}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background/60 text-muted-foreground hover:text-destructive active:scale-95"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => { resetIdle(); setSaving((v) => !v); setRenaming(false); setDraftName(""); }}
                    className="flex items-center gap-1 rounded-md border border-border bg-background/60 px-2 py-1 font-mono text-[10px] uppercase text-foreground active:scale-95"
                  >
                    <Plus className="h-3 w-3" />
                    Save
                  </button>
                </div>
              </div>
              {(saving || renaming) && (
                <form
                  onSubmit={(e) => { e.preventDefault(); resetIdle(); void (renaming ? submitRename() : submitSave()); }}
                  className="mb-1.5 flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => { resetIdle(); setDraftName(e.target.value); }}
                    placeholder={renaming ? "New name..." : "Preset name..."}
                    maxLength={28}
                    autoFocus
                    className="h-8 flex-1 rounded-lg border border-border bg-background px-2.5 font-mono text-xs text-foreground outline-none focus:border-foreground"
                  />
                  <button
                    type="submit"
                    disabled={!draftName.trim()}
                    aria-label="Confirm save preset"
                    className="flex h-8 items-center gap-1 rounded-lg border border-foreground bg-foreground px-2.5 font-mono text-[11px] font-bold uppercase text-background disabled:opacity-40"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {renaming ? "Rename" : "Save"}
                  </button>
                </form>
              )}
              <div className="grid max-h-[126px] grid-cols-4 gap-1.5 overflow-y-auto pr-0.5">
                {presets.map((p) => {
                  const selected = led.on && led.preset === p.id;
                  const swatch = p.swatch ?? ledCss({ hue: p.state.hue, sat: p.state.sat, preset: p.id, effect: p.state.effect }, status);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { resetIdle(); onPreset(p.id); }}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-1.5 font-mono text-[11px] transition-all active:scale-95 ${selected ? "border-foreground bg-secondary text-secondary-foreground" : "border-border bg-background/60 text-muted-foreground"}`}
                    >
                      <span className="h-5 w-5 rounded-full border border-border/60" style={{ background: swatch }} />
                      <span className="truncate">{p.label}</span>
                    </button>
                  );
                })}
                {(() => {
                  const selected = led.on && led.preset === "status";
                  const swatch = ledCss({ hue: 0, sat: 0, preset: "status", effect: "solid" }, status);
                  return (
                    <button
                      type="button"
                      onClick={() => { resetIdle(); onPreset("status"); }}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-1.5 font-mono text-[11px] transition-all active:scale-95 ${selected ? "border-foreground bg-secondary text-secondary-foreground" : "border-border bg-background/60 text-muted-foreground"}`}
                    >
                      <span className="h-5 w-5 rounded-full border border-border/60" style={{ background: swatch }} />
                      <span className="truncate">Work status</span>
                    </button>
                  );
                })()}
              </div>
            </div>

            <div>
              <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Effects</div>
              <div className="grid grid-cols-5 gap-1.5">
                {LED_EFFECTS.map((e) => {
                  const selected = led.on && led.effect === e.id;
                  return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => { resetIdle(); onPatchImmediate({ on: true, effect: e.id, preset: led.preset === "status" ? null : led.preset }); }}
                    className={`rounded-lg border px-2 py-1.5 font-mono text-[11px] font-medium transition-all active:scale-95 ${selected ? "border-foreground bg-secondary text-secondary-foreground" : "border-border bg-background/60 text-muted-foreground"}`}
                  >
                    {e.label}
                  </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t border-border pt-2.5">
          <div className="flex flex-1 items-center gap-2.5">
            <Sun className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="range"
              min={0}
              max={100}
              value={led.brightness}
              aria-label="Brightness"
              onChange={(e) => { resetIdle(); onPatchDebounced({ brightness: Number(e.target.value) }); }}
              onPointerUp={onFlush}
              style={{ "--led": color } as CSSProperties}
              className="led-slider flex-1"
            />
            <span className="w-10 text-right font-mono text-xs font-bold">{led.brightness}%</span>
          </div>
          <div className={`flex flex-1 items-center gap-2.5 transition-opacity ${animated ? "opacity-100" : "opacity-40"}`}>
            <Gauge className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="range"
              min={1}
              max={100}
              value={led.speed}
              disabled={!animated}
              aria-label="Effect speed"
              onChange={(e) => { resetIdle(); onPatchDebounced({ speed: Number(e.target.value) }); }}
              onPointerUp={onFlush}
              style={{ "--led": color } as CSSProperties}
              className="led-slider flex-1"
            />
            <span className="w-10 text-right font-mono text-xs font-bold">{led.speed}%</span>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

function ColorWheel({ hue, sat, onPick, onRelease }: { hue: number; sat: number; onPick: (h: number, s: number) => void; onRelease: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const pickAt = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const r = rect.width / 2;
    const dx = clientX - (rect.left + r);
    const dy = clientY - (rect.top + r);
    const dist = Math.min(r, Math.hypot(dx, dy));
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    const h = ((angle % 360) + 360) % 360;
    const s = Math.round((dist / r) * 100);
    onPick(Math.round(h), s);
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pickAt(e.clientX, e.clientY);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.buttons > 0 || e.pointerType === "touch") pickAt(e.clientX, e.clientY);
  };

  const rad = ((hue - 90) * Math.PI) / 180;
  const pct = (sat / 100) * 50;
  const left = 50 + Math.cos(rad) * pct;
  const top = 50 + Math.sin(rad) * pct;

  return (
    <div
      ref={ref}
      role="slider"
      aria-label="Color wheel"
      aria-valuetext={`Hue ${hue}, saturation ${sat}%`}
      tabIndex={0}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      className="relative mx-auto h-[176px] w-[176px] touch-none select-none rounded-full border-2 border-border shadow-inner"
      style={{
        background:
          "radial-gradient(circle, white 0%, transparent 72%), conic-gradient(hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))",
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-[0_0_0_2px_var(--foreground)]"
        style={{ left: `${left}%`, top: `${top}%`, background: `hsl(${hue} ${sat}% 55%)` }}
      />
    </div>
  );
}