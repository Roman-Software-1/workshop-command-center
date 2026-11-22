## Technical details
- `src/lib/panel-data.ts`: add `WEEK_TARGET_H = 40` and `MONTH_TARGET_H = 160`, plus helpers for week-to-date (Monday through today) and month-to-date totals.
- `VariantA.tsx`: add a `ProgressTile` component under the Break line. Trim the hero's vertical spacing so the hero grows only slightly. Check there's no overflow at 1024×600.
- `src/styles.css`: add a `--tile-raised` surface token so the strip uses only semantic colors.
- Add `roadmap.md` entries for both asks.
