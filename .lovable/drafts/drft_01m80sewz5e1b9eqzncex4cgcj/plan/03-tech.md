## Technical details
- `styles.css`: add `--heat-1` through `--heat-5` oklch tokens (red, orange, yellow, lime, green).
- `MonthHeatmap` in `VariantA.tsx`: replace the opacity `level()` with a `heatColor(h)` bucket function, and update the legend.
- Add a small test checking the bucket edges (2.9h is red, 8h is bright green). Verify the layout at 1024×600.
