import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Deliberately public and read-only: the owner permits only dashboard aggregates.
// No caller-controlled query, date range, account, or provider operation is accepted.
export const getRizeTotals = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchRizeTotals } = await import("./rize.server");
  return fetchRizeTotals();
});

const clockAction = z.enum(["in", "out", "break:bathroom", "break:coffee", "break:general"]);

// Public by owner choice: the workshop kiosk clocks in/out without sign-in.
// Only a fixed set of actions is accepted and only status/kind/start time is returned.
export const getClockState = createServerFn({ method: "GET" }).handler(async () => {
  const { readClockState } = await import("./rize-session.server");
  return readClockState();
});

export const setClockState = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => clockAction.parse(d))
  .handler(async ({ data }) => {
    const { applyClockAction } = await import("./rize-session.server");
    return applyClockAction(data);
  });
