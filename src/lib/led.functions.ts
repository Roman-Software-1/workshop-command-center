import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ledStateSchema } from "./led-schema";

export const getLedSnapshotFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getLedSnapshot } = await import("./led.server");
  return getLedSnapshot();
});

const setDesiredInput = z.object({
  baseRevision: z.number().int().min(0).nullable(),
  requestId: z.string().min(4).max(80),
  state: ledStateSchema,
  force: z.boolean().optional(),
});

export const setLedDesiredFn = createServerFn({ method: "POST" })
  .inputValidator((data) => setDesiredInput.parse(data))
  .handler(async ({ data }) => {
    const { updateLedDesired } = await import("./led.server");
    return updateLedDesired({
      baseRevision: data.baseRevision,
      requestId: data.requestId,
      state: data.state,
      ...(data.force !== undefined ? { force: data.force } : {}),
    });
  });

export const saveLedPresetFn = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ name: z.string().min(1).max(28), state: ledStateSchema }).parse(data))
  .handler(async ({ data }) => {
    const { saveLedPreset } = await import("./led.server");
    return saveLedPreset(data.name, data.state);
  });

export const updateLedPresetFn = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().min(1).max(64), state: ledStateSchema }).parse(data))
  .handler(async ({ data }) => {
    const { updateLedPreset } = await import("./led.server");
    return updateLedPreset(data.id, data.state);
  });

export const renameLedPresetFn = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().min(1).max(64), name: z.string().min(1).max(28) }).parse(data))
  .handler(async ({ data }) => {
    const { renameLedPreset } = await import("./led.server");
    return renameLedPreset(data.id, data.name);
  });

export const duplicateLedPresetFn = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().min(1).max(64) }).parse(data))
  .handler(async ({ data }) => {
    const { duplicateLedPreset } = await import("./led.server");
    return duplicateLedPreset(data.id);
  });

export const deleteLedPresetFn = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().min(1).max(64) }).parse(data))
  .handler(async ({ data }) => {
    const { deleteLedPreset } = await import("./led.server");
    return deleteLedPreset(data.id);
  });

export const rotateLedTokenFn = createServerFn({ method: "POST" }).handler(async () => {
  const { rotateDeviceToken } = await import("./led.server");
  return rotateDeviceToken();
});

export const revokeLedTokenFn = createServerFn({ method: "POST" }).handler(async () => {
  const { revokeDeviceToken } = await import("./led.server");
  return revokeDeviceToken();
});

export const saveLedCalibrationFn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ groupCount: z.number().int().min(1).max(2000), direction: z.union([z.literal(1), z.literal(-1)]) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { saveCalibration } = await import("./led.server");
    return saveCalibration(data.groupCount, data.direction);
  });