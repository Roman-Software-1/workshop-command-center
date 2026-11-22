import { describe, expect, it } from "vitest";
import { fmtBreak } from "@/lib/break";
describe("break timer", () => {
  it("shows m:ss under an hour", () => expect(fmtBreak(12 * 60_000 + 47_000)).toBe("12:47"));
  it("shows h:mm:ss past an hour", () => expect(fmtBreak(3600_000 + 5 * 60_000 + 3_000)).toBe("1:05:03"));
  it("never goes negative", () => expect(fmtBreak(-5000)).toBe("0:00"));
});
