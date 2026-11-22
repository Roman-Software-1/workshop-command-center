import { createServerFn } from "@tanstack/react-start";

// Deliberately public and read-only: the owner permits only dashboard aggregates.
// No caller-controlled query, date range, account, or provider operation is accepted.
export const getRizeTotals = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchRizeTotals } = await import("./rize.server");
  return fetchRizeTotals();
});