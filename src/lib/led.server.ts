import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import {
  DEFAULT_LED,
  LED_DEVICE_ID,
  LED_SCHEMA_VERSION,
  deviceReportSchema,
  extractPresetState,
  ledStateSchema,
  normalizeLedState,
  type DeviceReportPayload,
  type LedPreset,
  type LedSnapshot,
  type LedState,
} from "./led-schema";

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function generateDeviceToken(): string {
  const buf = new Uint8Array(24);
  crypto.getRandomValues(buf);
  return "led_" + Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getLedSnapshot(deviceId = LED_DEVICE_ID): Promise<LedSnapshot> {
  const [{ data: dev, error: dErr }, { data: des, error: desErr }, { data: rep, error: rErr }, { data: pre, error: pErr }] =
    await Promise.all([
      supabaseAdmin.from("led_devices").select("*").eq("id", deviceId).single(),
      supabaseAdmin.from("led_desired").select("*").eq("device_id", deviceId).single(),
      supabaseAdmin.from("led_reported").select("*").eq("device_id", deviceId).single(),
      supabaseAdmin.from("led_presets").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    ]);

  if (dErr || !dev) throw new Error(dErr?.message ?? "LED device not found");
  if (desErr || !des) throw new Error(desErr?.message ?? "LED desired state not found");
  if (rErr || !rep) throw new Error(rErr?.message ?? "LED reported state not found");
  if (pErr) throw new Error(pErr.message);

  const presets: LedPreset[] = (pre ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    state: extractPresetState(normalizeLedState({ ...DEFAULT_LED, ...(row.state as Record<string, unknown>) })),
    swatch: row.swatch,
    custom: row.custom,
  }));

  return {
    device: {
      id: dev.id,
      name: dev.name,
      hasToken: Boolean(dev.token_hash),
      tokenPrefix: dev.token_prefix,
      groupCount: dev.group_count,
      groupCountProvisional: dev.group_count_provisional,
      direction: dev.direction === -1 ? -1 : 1,
    },
    desired: {
      schemaVersion: des.schema_version,
      revision: Number(des.revision),
      state: normalizeLedState(des.state),
      updatedAt: des.updated_at,
    },
    reported: {
      appliedRevision: Number(rep.applied_revision),
      bootId: rep.boot_id,
      controllerVersion: rep.controller_version,
      status: rep.status,
      lastError: rep.last_error,
      heartbeatAt: rep.heartbeat_at,
    },
    presets,
  };
}

export async function updateLedDesired(params: {
  deviceId?: string;
  baseRevision: number | null;
  requestId: string;
  state: LedState;
  force?: boolean;
}) {
  const valid = ledStateSchema.parse(params.state);
  const { data, error } = await supabaseAdmin.rpc("apply_led_desired", {
    p_device_id: params.deviceId ?? LED_DEVICE_ID,
    p_base_revision: params.baseRevision ?? 0,
    p_request_id: params.requestId,
    p_state: valid as unknown as Json,
    p_force: Boolean(params.force),
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("No result from apply_led_desired");
  return {
    outcome: row.outcome as "ok" | "dedup" | "stale",
    revision: Number(row.revision),
    state: normalizeLedState(row.state),
    updatedAt: row.updated_at,
  };
}

export async function saveLedPreset(name: string, led: LedState): Promise<LedPreset> {
  const label = name.trim().slice(0, 28);
  if (!label) throw new Error("Preset name is required");
  const id = `custom-${Date.now()}`;
  const state = extractPresetState(ledStateSchema.parse(led));
  const { error } = await supabaseAdmin.from("led_presets").insert({
    id,
    label,
    state: state as unknown as Json,
    custom: true,
    sort_order: 100,
  });
  if (error) throw new Error(error.message);
  return { id, label, state, swatch: null, custom: true };
}

export async function updateLedPreset(id: string, led: LedState) {
  const state = extractPresetState(ledStateSchema.parse(led));
  const { error } = await supabaseAdmin
    .from("led_presets")
    .update({ state: state as unknown as Json, swatch: null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { id, state };
}

export async function renameLedPreset(id: string, name: string) {
  const label = name.trim().slice(0, 28);
  if (!label) throw new Error("Preset name is required");
  const { error } = await supabaseAdmin
    .from("led_presets")
    .update({ label, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { id, label };
}

export async function duplicateLedPreset(id: string): Promise<LedPreset> {
  const { data, error } = await supabaseAdmin.from("led_presets").select("*").eq("id", id).single();
  if (error || !data) throw new Error("Preset not found");
  const newId = `custom-${Date.now()}`;
  const label = `${data.label} copy`.slice(0, 28);
  const { error: insErr } = await supabaseAdmin.from("led_presets").insert({
    id: newId,
    label,
    state: data.state,
    swatch: data.swatch,
    custom: true,
    sort_order: 100,
  });
  if (insErr) throw new Error(insErr.message);
  return {
    id: newId,
    label,
    state: extractPresetState(normalizeLedState({ ...DEFAULT_LED, ...(data.state as Record<string, unknown>) })),
    swatch: data.swatch,
    custom: true,
  };
}

export async function deleteLedPreset(id: string) {
  const { error } = await supabaseAdmin.from("led_presets").delete().eq("id", id).eq("custom", true);
  if (error) throw new Error(error.message);
  return { id };
}

export async function rotateDeviceToken(deviceId = LED_DEVICE_ID) {
  const token = generateDeviceToken();
  const hash = await sha256Hex(token);
  const prefix = token.slice(0, 10);
  const { error } = await supabaseAdmin
    .from("led_devices")
    .update({ token_hash: hash, token_prefix: prefix, updated_at: new Date().toISOString() })
    .eq("id", deviceId);
  if (error) throw new Error(error.message);
  return { token, tokenPrefix: prefix };
}

export async function revokeDeviceToken(deviceId = LED_DEVICE_ID) {
  const { error } = await supabaseAdmin
    .from("led_devices")
    .update({ token_hash: null, token_prefix: null, updated_at: new Date().toISOString() })
    .eq("id", deviceId);
  if (error) throw new Error(error.message);
  return { revoked: true };
}

export async function saveCalibration(groupCount: number, direction: 1 | -1, deviceId = LED_DEVICE_ID) {
  const count = Math.max(1, Math.min(2000, Math.round(groupCount)));
  const { error } = await supabaseAdmin
    .from("led_devices")
    .update({
      group_count: count,
      group_count_provisional: false,
      direction,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deviceId);
  if (error) throw new Error(error.message);
  return { groupCount: count, direction, groupCountProvisional: false };
}

export async function authenticateDevice(request: Request, deviceId = LED_DEVICE_ID): Promise<boolean> {
  const auth = request.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return false;
  const token = auth.slice(7).trim();
  if (!token) return false;
  const { data } = await supabaseAdmin.from("led_devices").select("token_hash").eq("id", deviceId).single();
  if (!data?.token_hash) return false;
  const hash = await sha256Hex(token);
  return constantTimeEqual(hash, data.token_hash);
}

export async function pollForDevice(deviceId: string, sinceRevision: number, waitMs = 20_000) {
  const deadline = Date.now() + Math.min(waitMs, 25_000);
  while (true) {
    const [{ data: dev }, { data: des }] = await Promise.all([
      supabaseAdmin.from("led_devices").select("group_count, group_count_provisional, direction").eq("id", deviceId).single(),
      supabaseAdmin.from("led_desired").select("schema_version, revision, state, updated_at").eq("device_id", deviceId).single(),
    ]);
    if (!dev || !des) throw new Error("Device not configured");
    const rev = Number(des.revision);
    if (rev > sinceRevision || Date.now() >= deadline) {
      return {
        deviceId,
        schemaVersion: des.schema_version ?? LED_SCHEMA_VERSION,
        revision: rev,
        state: normalizeLedState(des.state),
        updatedAt: des.updated_at,
        hardware: {
          groupCount: dev.group_count,
          groupCountProvisional: dev.group_count_provisional,
          direction: dev.direction === -1 ? -1 : 1,
        },
      };
    }
    await new Promise((r) => setTimeout(r, 600));
  }
}

export async function recordDeviceReport(deviceId: string, raw: unknown) {
  const payload: DeviceReportPayload = deviceReportSchema.parse(raw);
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("led_reported")
    .update({
      applied_revision: payload.appliedRevision,
      boot_id: payload.bootId,
      controller_version: payload.controllerVersion,
      status: payload.status,
      last_error: payload.lastError ?? null,
      capabilities: (payload.capabilities ?? null) as Json | null,
      applied_state: (payload.appliedState ?? null) as Json | null,
      heartbeat_at: now,
      updated_at: now,
    })
    .eq("device_id", deviceId);
  if (error) throw new Error(error.message);
  return { ok: true, heartbeatAt: now };
}