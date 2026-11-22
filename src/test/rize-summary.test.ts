import { describe, expect, it } from "vitest";
import { publicRizeMetrics, rizeDateRange, workshopDate, workshopMidnightUtc } from "@/lib/rize-summary";

const bucket = { date: "2026-11-22 04:00:00 -0500", workHours: 18720, focusTime: 13200, breakTime: 2100, meetingTime: 600 };
describe("Public Rize totals", () => {
  it("returns only aggregate totals, never detailed activity or account fields", () => {
    const result = publicRizeMetrics([{ ...bucket, ...{ title: "private activity", email: "private account", description: "private description", apiKey: "private field", categories: ["private category"] } }], "2026-11-22");
    expect(Object.keys(result).sort()).toEqual(["month", "monthHours", "today", "week", "weekHours"]);
    expect(Object.keys(result.today).sort()).toEqual(["breakMin", "focusMin", "hoursWorkedMin", "meetingMin"]);
    expect(Object.keys(result.week[0] ?? {}).sort()).toEqual(["day", "h"]);
    expect(JSON.stringify(result)).not.toContain("private");
  });
  it("converts Rize seconds to minutes without subtracting breaks from its work total", () => {
    expect(publicRizeMetrics([bucket], "2026-11-22").today).toEqual({ hoursWorkedMin: 312, focusMin: 220, breakMin: 35, meetingMin: 10 });
  });
  it("uses America/Detroit dates rather than UTC at midnight", () => {
    expect(workshopDate(new Date("2026-11-22T02:00:00Z"))).toBe("2026-11-21");
    expect(workshopDate(new Date("2026-07-01T03:00:00Z"))).toBe("2026-06-30");
  });
  it("fetches the previous month when the last seven days cross the month boundary", () => {
    expect(rizeDateRange(new Date("2026-12-02T12:00:00Z"))).toEqual({ today: "2026-12-02", start: "2026-11-26", end: "2026-12-02" });
  });
  it("sums Monday-to-today and shows future month days as null rather than zero", () => {
    const result = publicRizeMetrics([{ ...bucket, date: "2026-11-15", workHours: 3600 }, { ...bucket, date: "2026-11-16", workHours: 7200 }, bucket], "2026-11-22");
    expect(result.weekHours).toBeCloseTo(7.2);
    expect(result.monthHours).toBeCloseTo(8.2);
    expect(result.week).toHaveLength(7);
    expect(result.month.hours[21]).toBe(5.2);
    expect(result.month.hours[22]).toBeNull();
    expect(result.month.hours[0]).toBe(0);
  });
  it("uses Rize Tracked time for hours worked when available", () => {
    const r = publicRizeMetrics([bucket], "2026-11-22", new Map([["2026-11-22", 15180]]));
    expect(r.today.hoursWorkedMin).toBe(253);
    expect(r.today.breakMin).toBe(35);
  });
  it("starts the tracked day at Detroit midnight across daylight saving", () => {
    expect(workshopMidnightUtc("2026-11-22")).toBe("2026-11-22T05:00:00.000Z");
    expect(workshopMidnightUtc("2026-07-01")).toBe("2026-07-01T04:00:00.000Z");
  });
});
