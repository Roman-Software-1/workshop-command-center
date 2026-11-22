import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.resetModules(); });

describe("Rize public read boundary", () => {
  it("returns aggregates but strips all extra provider fields", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "test-only");
    vi.stubEnv("UDC_RIZE_API_KEY", "test-only");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { summaries: { buckets: [{ date: "2026-11-22", workHours: 3600, focusTime: 1800, breakTime: 600, meetingTime: 0, title: "private activity", description: "private notes" }], email: "private account" } } })));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchRizeTotals } = await import("@/lib/rize.server");
    const result = await fetchRizeTotals(new Date("2026-11-22T12:00:00Z"));
    expect(result.metrics?.today.hoursWorkedMin).toBe(60);
    expect(result.error).toBeNull();
    expect(JSON.stringify(result)).not.toContain("private");
    await fetchRizeTotals(new Date("2026-11-22T12:00:00Z"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("never returns or logs a raw provider error and never falls back to sample data", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "test-only");
    vi.stubEnv("UDC_RIZE_API_KEY", "test-only");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private error details", { status: 403 })));
    const { fetchRizeTotals } = await import("@/lib/rize.server");
    expect(await fetchRizeTotals(new Date("2026-11-22T12:00:00Z"))).toEqual({ metrics: null, updatedAt: null, error: "Rize unavailable (403)" });
    expect(log).toHaveBeenCalledWith("Rize totals request failed", 403);
    expect(JSON.stringify(log.mock.calls)).not.toContain("private");
  });
});