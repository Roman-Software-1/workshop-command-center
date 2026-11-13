import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBurst } from "@/components/panel/StatusBurst";

describe("Status change feedback lifecycle", () => {
  it("skips initial load and removes feedback when the finite animation finishes", () => {
    const { container, rerender } = render(<StatusBurst status="out" compact />);
    expect(container.childElementCount).toBe(0);
    rerender(<StatusBurst status="in" compact />);
    const feedback = screen.getByText("Clocked in").parentElement;
    if (!feedback) throw new Error("Missing feedback container");
    fireEvent.animationEnd(feedback);
    expect(container.childElementCount).toBe(0);
    rerender(<StatusBurst status="break" compact />);
    expect(container.childElementCount).toBe(1);
  });
});