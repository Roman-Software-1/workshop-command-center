import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/spotify.server", () => ({}));
import { clampVolume, MUSIC_MODAL_IDLE_MS } from "@/lib/music-modal";

describe("music pop-up rules", () => {
  it("auto-closes after 30 seconds idle", () => expect(MUSIC_MODAL_IDLE_MS).toBe(30_000));
  it("keeps volume between 0 and 100", () => {
    expect(clampVolume(-10)).toBe(0);
    expect(clampVolume(110)).toBe(100);
  });
});
