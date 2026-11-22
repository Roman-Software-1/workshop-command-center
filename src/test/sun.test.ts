import { describe, it, expect } from "vitest";
import { daylightFor } from "@/lib/sun";

describe("daylightFor", () => {
  it("New York on Nov 22 2026: sunrise ~6:51, sunset ~16:31", () => {
    const d = daylightFor(new Date(Date.UTC(2026, 10, 22, 12)), { name: "NYC", lat: 40.71, lon: -74.01, timeZone: "America/New_York" });
    expect(Math.abs(d.sunrise - (6 * 60 + 51))).toBeLessThanOrEqual(4);
    expect(Math.abs(d.sunset - (16 * 60 + 31))).toBeLessThanOrEqual(4);
  });
});
