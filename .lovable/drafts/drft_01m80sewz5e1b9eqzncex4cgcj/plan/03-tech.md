## Technical details
- Add `DAYLIGHT = { sunrise: "06:50", sunset: "16:40", twilightMin: 30 }` sample data to `panel-data.ts`.
- Add a `DaylightBar` component in `VariantA.tsx`, with the heatmap block switched to a two-column layout (heatmap + bar). The bands go in a CSS linear-gradient, and the "now" position comes from the panel clock, so it updates without any animation.
- Add tokens for night, twilight, and day colors to `styles.css`.
- Verify there's no overflow at 1024×600.
