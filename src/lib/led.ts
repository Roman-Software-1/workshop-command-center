import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  DEFAULT_LED,
  computeSyncStatus,
  type LedPreset,
  type LedSnapshot,
  type LedState,
} from "./led-schema";
import {
  deleteLedPresetFn,
  duplicateLedPresetFn,
  getLedSnapshotFn,
  renameLedPresetFn,
  revokeLedTokenFn,
  rotateLedTokenFn,
  saveLedCalibrationFn,
  saveLedPresetFn,
  setLedDesiredFn,
  updateLedPresetFn,
} from "./led.functions";

export * from "./led-schema";

export const LED_QUERY_KEY = ["led-snapshot"] as const;
const SLIDER_DEBOUNCE_MS = 200;

function makeRequestId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useLed(modalOpen = false) {
  const queryClient = useQueryClient();
  const getSnapshot = useServerFn(getLedSnapshotFn);
  const setDesired = useServerFn(setLedDesiredFn);
  const savePresetCall = useServerFn(saveLedPresetFn);
  const updatePresetCall = useServerFn(updateLedPresetFn);
  const renamePresetCall = useServerFn(renameLedPresetFn);
  const duplicatePresetCall = useServerFn(duplicateLedPresetFn);
  const deletePresetCall = useServerFn(deleteLedPresetFn);
  const rotateTokenCall = useServerFn(rotateLedTokenFn);
  const revokeTokenCall = useServerFn(revokeLedTokenFn);
  const saveCalCall = useServerFn(saveLedCalibrationFn);

  const query = useQuery<LedSnapshot>({
    queryKey: LED_QUERY_KEY,
    queryFn: () => getSnapshot(),
    refetchInterval: modalOpen ? 3000 : 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

  const [draft, setDraft] = useState<LedState | null>(null);
  const [pendingSend, setPendingSend] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStateRef = useRef<LedState | null>(null);
  const baseRevRef = useRef<number>(1);

  const serverState = query.data?.desired.state ?? DEFAULT_LED;
  const serverRevision = query.data?.desired.revision ?? 1;

  useEffect(() => {
    if (query.data) {
      baseRevRef.current = query.data.desired.revision;
      if (!debounceRef.current && !pendingSend) {
        setDraft(null);
      }
    }
  }, [query.data, pendingSend]);

  const sendMutation = useMutation({
    mutationFn: async (vars: { state: LedState; force?: boolean }) =>
      setDesired({
        data: {
          baseRevision: baseRevRef.current,
          requestId: makeRequestId(),
          state: vars.state,
          ...(vars.force ? { force: true } : {}),
        },
      }),
    onMutate: () => setPendingSend(true),
    onSuccess: (res) => {
      baseRevRef.current = res.revision;
      if (res.outcome === "stale") {
        toast.warning("Lights were changed on another screen — refreshed to latest.");
        setDraft(null);
      }
      queryClient.invalidateQueries({ queryKey: LED_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not send LED update");
    },
    onSettled: () => setPendingSend(false),
  });

  const led = draft ?? serverState;

  const sendNow = useCallback(
    (next: LedState, force = false) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      pendingStateRef.current = null;
      setDraft(next);
      sendMutation.mutate({ state: next, force });
    },
    [sendMutation],
  );

  const sendDebounced = useCallback(
    (next: LedState) => {
      setDraft(next);
      pendingStateRef.current = next;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        const s = pendingStateRef.current;
        pendingStateRef.current = null;
        if (s) sendMutation.mutate({ state: s });
      }, SLIDER_DEBOUNCE_MS);
    },
    [sendMutation],
  );

  const flushPending = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const s = pendingStateRef.current;
    pendingStateRef.current = null;
    if (s) sendMutation.mutate({ state: s });
  }, [sendMutation]);

  const patchImmediate = useCallback(
    (patch: Partial<LedState>, force = false) => {
      const next: LedState = { ...led, ...patch, calibrationProbe: null };
      sendNow(next, force);
    },
    [led, sendNow],
  );

  const patchDebounced = useCallback(
    (patch: Partial<LedState>) => {
      const next: LedState = { ...led, ...patch, calibrationProbe: null };
      sendDebounced(next);
    },
    [led, sendDebounced],
  );

  const turnOff = useCallback(() => {
    sendNow({ ...led, on: false, calibrationProbe: null }, true);
  }, [led, sendNow]);

  const applyPreset = useCallback(
    (id: string) => {
      if (id === "status") {
        patchImmediate({ on: true, effect: "solid", preset: "status" });
        return;
      }
      const p = query.data?.presets.find((x) => x.id === id);
      if (!p) return;
      patchImmediate({ on: true, ...p.state, preset: p.id });
    },
    [patchImmediate, query.data?.presets],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: LED_QUERY_KEY });

  const savePreset = async (name: string) => {
    try {
      const created = await savePresetCall({ data: { name, state: led } });
      await invalidate();
      patchImmediate({ preset: created.id });
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save preset");
      return false;
    }
  };

  const updatePreset = async (id: string) => {
    try {
      await updatePresetCall({ data: { id, state: led } });
      await invalidate();
      toast.success("Preset updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update preset");
    }
  };

  const renamePreset = async (id: string, name: string) => {
    try {
      await renamePresetCall({ data: { id, name } });
      await invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not rename preset");
    }
  };

  const duplicatePreset = async (id: string) => {
    try {
      const copy = await duplicatePresetCall({ data: { id } });
      await invalidate();
      patchImmediate({ preset: copy.id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not duplicate preset");
    }
  };

  const deletePreset = async (id: string) => {
    try {
      await deletePresetCall({ data: { id } });
      await invalidate();
      if (led.preset === id) patchImmediate({ preset: null });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete preset");
    }
  };

  const rotateToken = async () => {
    const res = await rotateTokenCall();
    await invalidate();
    return res;
  };

  const revokeToken = async () => {
    await revokeTokenCall();
    await invalidate();
    toast.success("Device token revoked");
  };

  const saveCalibration = async (groupCount: number, direction: 1 | -1) => {
    await saveCalCall({ data: { groupCount, direction } });
    await invalidate();
    toast.success(`Saved ${groupCount} groups`);
  };

  const probeCalibration = (indices: number[], brightness = 18) => {
    sendNow({ ...led, on: true, calibrationProbe: { indices, brightness } }, true);
  };

  const reported = query.data?.reported ?? {
    appliedRevision: 0,
    bootId: null,
    controllerVersion: null,
    status: "offline",
    lastError: null,
    heartbeatAt: null,
  };
  const sync = computeSyncStatus(serverRevision, reported, pendingSend || Boolean(debounceRef.current));

  return {
    led,
    presets: (query.data?.presets ?? []) as LedPreset[],
    device: query.data?.device ?? null,
    reported,
    revision: serverRevision,
    sync,
    browserOffline: query.isError,
    patchImmediate,
    patchDebounced,
    flushPending,
    turnOff,
    applyPreset,
    savePreset,
    updatePreset,
    renamePreset,
    duplicatePreset,
    deletePreset,
    rotateToken,
    revokeToken,
    saveCalibration,
    probeCalibration,
  };
}