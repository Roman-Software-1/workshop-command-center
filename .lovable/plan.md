# Break type picker + big break timer (design A)

## What you'll see
1. Tap **Break** → a frosted pop-up in the middle asks: **Bathroom**, **Coffee**, or **General** (big touch buttons, plus Cancel). Nothing changes until you pick one.
2. After picking, the screen stays in break mode (orange border) with a large centered card over a blurred dashboard:
   - Break type with an icon (e.g. "Coffee break")
   - Big timer counting up (m:ss, switches to h:mm:ss past an hour)
   - Two buttons: **Back to work** (clock in) and **Clock out**
3. The card stays until you end the break — it doesn't fade away. Tapping outside does nothing, so it can't be dismissed by accident.
4. The clock's status line reads e.g. "On break · Coffee".

## Notes
- The break timer starts at 0 each break and survives a page refresh on this screen (saved on the device).
- Break type is display-only for now; it isn't sent to Rize or ClickUp. The "Break" number from Rize stays as is.
- The usual status flash still plays when going in/out; for breaks the pop-up replaces it.

## Technical details
- `usePanel`: add `breakKind` ("bathroom" | "coffee" | "general" | null) and `breakStartedAt`; `startBreak(kind)`; persist to localStorage (read in useEffect to avoid hydration mismatch).
- New `BreakPicker.tsx` and `BreakOverlay.tsx` in `src/components/panel/`, rendered by VariantA inside the frame (z above content, reuse `music-scrim` frosted style).
- Break button opens the picker instead of calling `setStatus("break")` directly.
- Skip StatusBurst when entering break in A.
- Tests: picker choice sets status + kind; timer counts from start time; ending break clears it.
