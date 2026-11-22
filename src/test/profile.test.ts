import { describe, expect, it } from "vitest";
import { profileInput } from "@/lib/profile";

describe("saved profile details", () => {
  it("preserves display name and avatar", () => {
    expect(profileInput.parse({ display_name: " Roman ", avatar_url: "https://example.com/avatar.png" })).toEqual({ display_name: "Roman", avatar_url: "https://example.com/avatar.png" });
  });
  it("rejects executable avatar URLs", () => {
    expect(profileInput.safeParse({ display_name: "Roman", avatar_url: "javascript:alert(1)" }).success).toBe(false);
  });
});