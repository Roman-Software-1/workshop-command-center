# Workshop Control Panel (1024x600 touchscreen, landscape) — visual mockup

A single full-screen dashboard sized exactly for the mini monitor, built for touch (large tap targets, no scrolling). This version is visual only, with sample data; ClickUp, Rize and real lights connect later.

## Status border
A thick glowing border around the whole screen shows work status at a glance:
- Red = clocked out
- Orange = on break (coffee / regular)
- Green = clocked in

The clock panel has three touch buttons (Clock in, Break, Clock out) that switch the border color so you can preview each state.

## Layout

```text
+================ status border (red / orange / green) ================+
| LEFT  (~45%)               | RIGHT (~55%)                           |
| [ MASTER LIGHTS  ON/OFF ]  |  Big clock + date                      |
|                            |  Status + shift timer                  |
| Presets:                   |  [Clock in] [Break] [Clock out]        |
| [Work][Detail][Clean][Off] |----------------------------------------|
|                            |  Top tasks (ClickUp sample)            |
| Today:                     |   - 4-5 priority tasks, tap to check   |
|  Hours worked   5h 12m     |----------------------------------------|
|  Tasks done     7 / 12     |  Focus metrics (Rize sample)           |
|  Focus time     3h 40m     |   focus score, breaks, top category    |
+======================================================================+
```

## Visual direction
Dark, high-contrast "workshop instrument panel": near-black background, status color echoed in the border and active buttons, monospace numerals for timers, readable from a few feet away.

## Behavior (mockup)
- Light toggle and presets change on screen only (no real lights).
- Live clock; shift timer runs while clocked in.
- Sample tasks and Rize metrics kept in one place for easy swap later.

## Later
- Real ClickUp, Rize, and smart-light connections.

## Technical details
- Rewrite `src/routes/index.tsx`; components in `src/components/panel/`; mock data in `src/lib/panel-data.ts`.
- Status color tokens (oklch) in `src/styles.css`; fonts via root head `<link>`; update head metadata.
