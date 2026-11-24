# Bar counter LED controller (design A)

## What you get
- The A / B / C switcher in the top right is removed from design A (B and C pages still exist, just not linked from A).
- In its place, right of the clock/timer area: a small **vertical LED pill** (about 34x80). It looks like a mini light strip — a glowing bar filled with the current LED color, with a soft slow "breathing" glow. When the LEDs are off it goes dark gray with a dim outline.
- Tapping it opens a centered dialog with the rest of the screen frosted, same style as the music pop-up. Closes on outside tap, X, or after 30s idle.

## Dialog contents
- **Color wheel** (touch-drag a dot around a hue/saturation circle), large enough for a finger.
- **Presets** row: Warm white, Cool white, Amber, Red, Green, Blue, Purple, and a status-matched "Work status" preset (follows red/orange/green).
- **Brightness slider** (0–100%) with big thumb.
- **On/Off** toggle.
- Live preview: the pill on the dashboard and a strip preview in the dialog update instantly.

## For now
- No hardware yet: the chosen color, brightness and on/off are remembered on this screen (survive refresh). Later, the Pi reads these same settings to drive the real strip.
- Not locked behind sign-in, same as the clock buttons.
