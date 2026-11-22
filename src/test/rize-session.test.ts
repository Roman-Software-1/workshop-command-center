import { describe, expect, it } from "vitest";
import { clockStateFrom, sessionFor } from "@/lib/rize-session";

describe("Rize clock sync", () => {
  it("clock in starts an open-ended focus session", () => expect(sessionFor("in")).toEqual({ type: "focus", title: "Workshop", length: 43_200 }));
  it("a coffee break starts a labeled break session", () => expect(sessionFor("break:coffee")).toEqual({ type: "break", title: "Coffee break", length: 7_200 }));
  it("clock out only stops", () => expect(sessionFor("out")).toBeNull());
  it("a running Rize break shows as that break on screen", () => {
    const s = clockStateFrom({ type: "break", title: "Bathroom break", startTime: "2026-11-22T16:00:00Z", endTime: "2026-11-22T23:00:00Z" }, Date.parse("2026-11-22T16:05:00Z"));
    expect(s).toEqual({ status: "break", kind: "bathroom", startedAt: Date.parse("2026-11-22T16:00:00Z") });
  });
  it("a focus started on the computer shows as clocked in", () => {
    expect(clockStateFrom({ type: "focus", title: "Code", startTime: "2026-11-22T16:00:00Z", endTime: "2026-11-22T23:00:00Z" }, Date.parse("2026-11-22T17:00:00Z")).status).toBe("in");
  });
  it("no session means clocked out", () => expect(clockStateFrom(null).status).toBe("out"));
});
