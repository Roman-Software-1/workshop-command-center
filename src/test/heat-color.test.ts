import { expect, it } from "vitest";
import { heatColor } from "@/lib/panel-data";
it("buckets hours red to green", () => {
  expect(heatColor(0)).toBe("var(--muted)");
  expect(heatColor(2.9)).toBe("var(--heat-1)");
  expect(heatColor(3)).toBe("var(--heat-2)");
  expect(heatColor(7.9)).toBe("var(--heat-4)");
  expect(heatColor(8)).toBe("var(--heat-5)");
});
