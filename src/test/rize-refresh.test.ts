import { afterEach, describe, expect, it, vi } from "vitest";
import { focusManager, onlineManager, QueryClient, QueryObserver } from "@tanstack/react-query";
import { rizeTotalsQuery } from "@/lib/rize.queries";
import { getRizeTotals } from "@/lib/rize.functions";

vi.mock("@/lib/rize.functions", () => ({ getRizeTotals: vi.fn() }));

afterEach(() => {
  focusManager.setFocused(undefined);
  onlineManager.setOnline(true);
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe("Rize kiosk refresh", () => {
  it("checks every 60 seconds even when the page is marked hidden", async () => {
    vi.useFakeTimers();
    focusManager.setFocused(false);
    vi.mocked(getRizeTotals).mockResolvedValue({ metrics: null, updatedAt: null, error: "Rize unavailable" });
    const client = new QueryClient();
    const observer = new QueryObserver(client, rizeTotalsQuery);
    const unsubscribe = observer.subscribe(() => {});
    try {
      await vi.advanceTimersByTimeAsync(0);
      expect(getRizeTotals).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(59_999);
      expect(getRizeTotals).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(getRizeTotals).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(60_000);
      expect(getRizeTotals).toHaveBeenCalledTimes(3);
    } finally {
      unsubscribe();
      client.clear();
    }
  });

  it("checks immediately on return to the screen even with fresh cached data", async () => {
    vi.useFakeTimers();
    focusManager.setFocused(false);
    vi.mocked(getRizeTotals).mockResolvedValue({ metrics: null, updatedAt: null, error: "Rize unavailable" });
    const client = new QueryClient();
    client.mount();
    const observer = new QueryObserver(client, rizeTotalsQuery);
    const unsubscribe = observer.subscribe(() => {});
    try {
      await vi.advanceTimersByTimeAsync(0);
      expect(getRizeTotals).toHaveBeenCalledTimes(1);
      focusManager.setFocused(true);
      await vi.advanceTimersByTimeAsync(0);
      expect(getRizeTotals).toHaveBeenCalledTimes(2);
    } finally {
      unsubscribe();
      client.unmount();
      client.clear();
    }
  });

  it("checks immediately after connectivity returns", async () => {
    vi.useFakeTimers();
    vi.mocked(getRizeTotals).mockResolvedValue({ metrics: null, updatedAt: null, error: "Rize unavailable" });
    const client = new QueryClient();
    client.mount();
    const observer = new QueryObserver(client, rizeTotalsQuery);
    const unsubscribe = observer.subscribe(() => {});
    try {
      await vi.advanceTimersByTimeAsync(0);
      expect(getRizeTotals).toHaveBeenCalledTimes(1);
      onlineManager.setOnline(false);
      onlineManager.setOnline(true);
      await vi.advanceTimersByTimeAsync(0);
      expect(getRizeTotals).toHaveBeenCalledTimes(2);
    } finally {
      unsubscribe();
      client.unmount();
      client.clear();
    }
  });
});