import { queryOptions } from "@tanstack/react-query";
import { getRizeTotals } from "./rize.functions";

export const rizeTotalsQuery = queryOptions({
  queryKey: ["rize", "public-totals"],
  queryFn: () => getRizeTotals(),
  staleTime: 60_000,
  refetchInterval: 60_000,
  refetchIntervalInBackground: false,
  retry: false,
});