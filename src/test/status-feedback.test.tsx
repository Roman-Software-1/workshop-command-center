import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StatusBurst } from "@/components/panel/StatusBurst";

afterEach(() => vi.useRealTimers());

describe("Temporary status feedback", () => {
  it("shows only after a status change and clears when the overlay finishes", () => {
    const { container, rerender } = render(<StatusBurst status="out" frosted />);
    expect(container.childElementCount).toBe(0);
    rerender(<StatusBurst status="in" frosted />);
    const feedback = screen.getByText("Clocked in").parentElement;
    if (!feedback) throw new Error("Missing status feedback");
    fireEvent.animationEnd(feedback);
    expect(container.childElementCount).toBe(0);
  });

  it("clears even when animation events are unavailable", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<StatusBurst status="out" frosted />);
    rerender(<StatusBurst status="break" frosted />);
    expect(container.childElementCount).toBe(1);
    act(() => vi.advanceTimersByTime(1800));
    expect(container.childElementCount).toBe(0);
  });
});