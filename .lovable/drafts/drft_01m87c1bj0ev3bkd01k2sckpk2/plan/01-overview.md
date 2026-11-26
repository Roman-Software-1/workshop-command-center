# Real bar counter LEDs, controlled from the workshop screen

Connect the existing LED pop-up to the real strip on your Pi (clockstation, GPIO21). Anyone on the workshop screen can change the lights without signing in, just like the clock buttons. The Pi has its own private key and is the only thing that can report what the lights are actually showing.

## What you'll see
- The same LED pill and pop-up, kept at 1024x600. Its controls are grouped so it still fits.
- A status chip that shows one of: **Sending**, **Applied by controller**, **Offline** (Pi not seen in the last 30s), or **Error**. It only says "Applied" after the Pi confirms it.
- A large **Off** button that skips the slider delay.
- Effects: Solid, RGB white, Slow rainbow + breathing (the default), Rainbow chase, Ocean flow, Amber breathing, Comet, Scanner, Firelight. Your current scenes stay, and you can still save, rename, duplicate and delete presets. Presets are now saved for every screen, not just this one.
- Controls: speed, direction, saturation, gradient spacing, chase width, breathing (on/off, period, min/max), how long to fade between presets, and pause/resume.
- A strip preview labeled "Preview, not live".
- **Setup** area: a step-by-step way to count the groups. It lights chosen groups dimly so you can find the last one, then saves the count and direction. The 1000 count is marked "provisional" until you do this.

## Not in this round
- Zones and schedules/sleep timer. These depend on the real group count, so they come after calibration.
- The screen can't change the lights while the internet is down. The Pi keeps showing the last setting and restores it after a reboot.
