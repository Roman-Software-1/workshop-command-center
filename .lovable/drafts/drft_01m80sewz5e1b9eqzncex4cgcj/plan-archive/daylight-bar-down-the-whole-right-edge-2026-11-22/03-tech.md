## Technical details
- `VariantA.tsx`: wrap the existing layout in `flex-row` with the content as `flex-1 min-w-0`, add `<DaylightBar />` in a `w-[84px] border-l` column, and remove it from `MonthHeatmap`. Hour ticks every 4h, including 00 and 24.
- `Frame.tsx`: move the A/B/C nav to top-left, design A only.
- Verify there's no overflow at 1024×600.
