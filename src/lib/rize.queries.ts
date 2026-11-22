import { queryOptions } from "@tanstack/react-query";
import { getClockState, getRizeTotals } from "./rize.functions";

export const rizeTotalsQuery = queryOptions({
  queryKey: ["rize", "public-totals"],
  queryFn: () => getRizeTotals(),
  staleTime: 60_000,
  refetchInterval: 60_000,
  // Kiosk/embedded previews can be marked hidden even while the screen is in use.
  refetchIntervalInBackground: true,
  refetchOnWindowFocus: "always",
  refetchOnReconnect: "always",
  retry: false,
});
export const clockStateQuery = queryOptions({
  queryKey: ["rize", "clock-state"],
  queryFn: () => getClockState(),
  refetchInterval: 15_000,
  refetchIntervalInBackground: true,
  refetchOnWindowFocus: "always",
  retry: false,
});
