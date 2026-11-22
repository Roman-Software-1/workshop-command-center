import { describe, expect, it } from "vitest";
import { projectNowPlaying, signState, verifyState } from "@/lib/spotify-core";

describe("spotify state", () => {
  it("accepts its own signature", async () => {
    expect(await verifyState(await signState("u1", "s"), "s")).toBe("u1");
  });
  it("rejects a different secret", async () => {
    expect(await verifyState(await signState("u1", "s"), "x")).toBeNull();
  });
  it("rejects state older than 10 minutes", async () => {
    expect(await verifyState(await signState("u1", "s", 0), "s", 11 * 60_000)).toBeNull();
  });
});

describe("now playing projection", () => {
  it("keeps only display fields", () => {
    const r = projectNowPlaying({ is_playing: true, progress_ms: 5, device: { id: "secret" }, item: { name: "Song", duration_ms: 10, artists: [{ name: "A" }], album: { images: [{ url: "u" }] } } }, 1);
    expect(r).toEqual({ status: "playing", title: "Song", artists: "A", art: "u", progressMs: 5, durationMs: 10, fetchedAt: 1 });
  });
});
