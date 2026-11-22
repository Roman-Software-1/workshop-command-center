# Connecting the switches, the screen, and your other computers

Right now every number on the screen is sample data stored in the page itself, so nothing is shared between devices. To share it, the dashboard needs one **central place online** that every device reads from and writes to. That place is **Lovable Cloud**: a database plus a few web addresses your devices can call.

## How it fits together

- **Raspberry Pi with switches.** A small script on the Pi watches the three switches. When one flips, the Pi sends a short message like "clock in" to the app's web address, along with a secret device key so nobody else can clock you in.
- **Cloud (the central place).** It saves every clock-in, break, and clock-out with a timestamp. From that log it works out today's hours, break time, the last 7 days, the month heatmap, and the week and month totals. All of those become real numbers instead of samples.
- **The HDMI screen.** The computer that boots into the webpage shows the dashboard. It updates **live** within about a second of a switch flip, and the border color and frost animation fire automatically.
- **Your main computer and others.** Each one can open the same page in a browser to see the same live data. Later, ClickUp and Rize can feed tasks and focus time into the same place.

## What to decide

- **Who can see the dashboard?** Either anyone with the link (simplest for a shop screen), or a sign-in for your other computers.
- **Should the on-screen buttons stay?** They can be kept as a backup, or removed now that the switches are physical.

## Important: where this gets turned on

Lovable Cloud has to be turned on from the **main project chat**, not from this draft. The steps are:

1. Accept this draft into the main project.
2. In the main project chat, ask to enable Lovable Cloud and build the steps below.

The screen design itself doesn't change.
