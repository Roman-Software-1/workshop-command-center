# Workshop Control Panel (1024x600 touchscreen, landscape)

A single full-screen dashboard sized exactly for the mini monitor, built for touch (large tap targets, no scrolling, no hover). First version uses sample data; ClickUp, Rize and real lights connect later.

## Layout

```text
+----------------------------+-----------------------------------+
| LEFT  (~45%)               | RIGHT (~55%)                      |
| [ MASTER LIGHTS  ON/OFF ]  |  Clock-in status + shift timer    |
|                            |  (big time, date)                 |
| Presets:                   |-----------------------------------|
| [Work][Detail][Clean][Off] |  Top tasks (ClickUp)              |
|                            |   - 4-5 priority tasks, due/tags  |
| Today:                     |   - tap to mark done              |
|  Hours worked   5h 12m     |-----------------------------------|
|  Tasks done     7 / 12     |  Focus metrics (Rize)             |
|  Focus time     3h 40m     |   focus %, breaks, top category   |
+----------------------------+-----------------------------------+
```

- Left: master light toggle (largest button), 4 preset scenes, today's stats (hours worked, tasks completed, focus time).
- Right: big clock + clock-in state and running timer, top priority tasks, Rize focus metrics (focus score, time by category, breaks). Right side kept modular so panels can be swapped later (weather, calendar).

## Visual direction
Dark, high-contrast "workshop instrument panel": near-black background, one amber accent for active/on states, monospace numerals for timers, readable from a few feet away. Avoids glare and stays legible in bright shops.

## Behavior (v1)
- Toggles and presets update on screen instantly (simulated lights).
- Clock updates live; shift timer runs while clocked in.
- Sample data for tasks and Rize metrics, stored in one place so it's easy to swap for real data.
- Screen locked to 1024x600, no scroll, kiosk-friendly.

## Later (not in v1)
- Real ClickUp tasks + time tracking (needs ClickUp API token).
- Rize data (needs Rize API key).
- Smart light control once you pick hardware (e.g. Home Assistant / Kasa / Hue).

## Technical details
- Rewrite `src/routes/index.tsx` as the dashboard; components under `src/components/panel/`.
- Mock data module `src/lib/panel-data.ts` with typed interfaces matching future ClickUp/Rize shapes.
- Theme tokens in `src/styles.css` (oklch), fonts via `<link>` in root head.
- Update head metadata.
