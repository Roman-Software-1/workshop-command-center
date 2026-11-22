import { clockStateFrom, sessionFor, type ClockAction, type ClockState } from "./rize-session";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/udc_rize/api/v1/graphql";
const SESSION = "type title startTime endTime";

async function gql(query: string, variables?: Record<string, unknown>): Promise<Record<string, any>> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["UDC_RIZE_API_KEY"];
  if (!apiKey || !connectionKey) throw new Error("Rize connection unavailable");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "X-Connection-Api-Key": connectionKey, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) { console.error("Rize session request failed", res.status); throw new Error(`Rize unavailable (${res.status})`); }
  const body = (await res.json()) as { data?: Record<string, any>; errors?: unknown[] };
  if (body.errors?.length || !body.data) { console.error("Rize session provider error"); throw new Error("Rize rejected the request"); }
  return body.data;
}

export async function readClockState(): Promise<ClockState> {
  const d = await gql(`{ currentSession { ${SESSION} } }`);
  return clockStateFrom(d["currentSession"] ?? null);
}

export async function applyClockAction(action: ClockAction): Promise<ClockState> {
  const current = await gql(`{ currentSession { ${SESSION} } }`);
  if (current["currentSession"] && clockStateFrom(current["currentSession"]).status !== "out") {
    const stop = await gql("mutation { stopSessionTimer(input:{}) { errors { message } } }");
    if (stop["stopSessionTimer"]?.errors?.length) throw new Error("Rize could not stop the session");
  }
  const next = sessionFor(action);
  if (!next) return { status: "out", kind: null, startedAt: null };
  const d = await gql(
    `mutation($type:String!,$title:String,$length:Int){ startSessionTimer(input:{type:$type,title:$title,length:$length}) { errors { message } session { ${SESSION} } } }`,
    next,
  );
  const r = d["startSessionTimer"];
  if (r?.errors?.length) throw new Error("Rize could not start the session");
  return clockStateFrom(r?.session ?? null);
}
