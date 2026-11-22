import { z } from "zod";
import { publicRizeMetrics, rizeDateRange, type RizeResult } from "./rize-summary";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/udc_rize/api/v1/graphql";
const summarySchema = z.object({ data: z.object({ summaries: z.object({ buckets: z.array(z.object({ date: z.string(), workHours: z.number(), focusTime: z.number(), breakTime: z.number(), meetingTime: z.number() })) }) }) });
let cached: { date: string; expires: number; result: RizeResult } | undefined;
let pending: { date: string; promise: Promise<RizeResult> } | undefined;

export async function fetchRizeTotals(now = new Date()): Promise<RizeResult> {
  const range = rizeDateRange(now);
  if (cached?.date === range.today && cached.expires > Date.now()) return cached.result;
  if (pending?.date === range.today) return pending.promise;
  const promise = readTotals(now);
  pending = { date: range.today, promise };
  try {
    const result = await promise;
    if (result.metrics) cached = { date: range.today, expires: Date.now() + 60_000, result };
    return result;
  } finally {
    if (pending?.promise === promise) pending = undefined;
  }
}

async function readTotals(now: Date): Promise<RizeResult> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  const connectionKey = process.env['UDC_RIZE_API_KEY'];
  if (!apiKey || !connectionKey) return { metrics: null, updatedAt: null, error: "Rize connection unavailable" };
  const range = rizeDateRange(now);
  try {
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "X-Connection-Api-Key": connectionKey, "Content-Type": "application/json" },
      body: JSON.stringify({ query: 'query WorkshopTotals($start:ISO8601Date!,$end:ISO8601Date!) { summaries(startDate:$start,endDate:$end,bucketSize:"day",includeCategories:false) { buckets { date workHours focusTime breakTime meetingTime } } }', variables: { start: range.start, end: range.end } }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      // Do not print raw provider errors: they can echo credentials or private account data.
      console.error("Rize totals request failed", response.status);
      return { metrics: null, updatedAt: null, error: `Rize unavailable (${response.status})` };
    }
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null && "errors" in body) {
      console.error("Rize totals returned a provider error");
      return { metrics: null, updatedAt: null, error: "Rize could not load totals" };
    }
    const parsed = summarySchema.safeParse(body);
    if (!parsed.success) return { metrics: null, updatedAt: null, error: "Rize returned incomplete totals" };
    return { metrics: publicRizeMetrics(parsed.data.data.summaries.buckets, range.today), updatedAt: new Date().toISOString(), error: null };
  } catch {
    return { metrics: null, updatedAt: null, error: "Rize temporarily unavailable" };
  }
}