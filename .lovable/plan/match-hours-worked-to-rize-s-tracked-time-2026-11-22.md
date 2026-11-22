# Match "Hours worked" to Rize's Tracked time

## What's wrong
Your Rize screenshot is the **Tracked** page (time entries you log: 4 hr 13 min today, 6 entries). The dashboard currently reads Rize's automatic "work hours" summary instead, which is a different number and starts the day at 4 AM. That's why they don't match.

## What changes
- "Hours worked", the week chart, the Week/Month progress tiles and the month heatmap all switch to **Tracked time** (sum of your time entries per day, midnight to midnight, Detroit time).
- A timer that is still running counts up to now, so today's number grows live like Rize's.
- Break, focus and meeting time stay on Rize's automatic summary (Tracked has no breaks), shown as before.
- Still refreshes every minute; on failure it shows "—", never made-up numbers.
- Your detailed entries (names, labels) never reach the screen — only daily totals.

## Check
Compare the dashboard against your Rize Tracked page for today (should read about 4h 13m) and yesterday.

## Technical details
- Step 1: confirm the exact Rize time-entry query and fields (startTime/endTime/duration, running entries) with a read-only call; adjust if the API shape differs.
- `rize.server.ts`: add a fixed time-entries query for the date range, bucket durations by America/Detroit date (split entries crossing midnight, clamp running entries to now); keep summaries query for break/focus/meeting.
- `rize-summary.ts`: `publicRizeMetrics` takes tracked-seconds-per-day for hours; explicit projection kept.
- Update `rize-summary` / `rize-server` tests with a 4h13m example and a midnight-crossing entry.
