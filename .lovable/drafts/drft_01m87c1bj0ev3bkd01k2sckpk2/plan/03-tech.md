## Technical details
- `Frame.tsx`: hide the variant nav when `variant === "a"`.
- New `src/lib/led.ts`: `LedState {on, hue, sat, brightness, preset}`, presets list, `ledCss(state)` → hsl color, localStorage key; small hook `useLed`.
- New `src/components/panel/LedPill.tsx` (absolute top-right, left of daylight bar) and `LedModal.tsx` (reuses `.music-scrim`/`.music-card` frost, idle close constant).
- Wheel: SVG conic hue + radial white fade, pointer events (touch drag) map to hue/sat.
- CSS: `.led-pill` glow via `--led` var, gentle 3s breathe on opacity only.
- Test: `ledCss` and brightness clamp in `src/test/led.test.ts`. Hardware sync (Pi endpoint) is a later step.
