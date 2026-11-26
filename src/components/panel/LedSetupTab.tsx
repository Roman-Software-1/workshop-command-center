import { useState } from "react";
import { Copy, Download, KeyRound, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import type { LedDeviceInfo, LedReported } from "@/lib/led";

type LedSetupTabProps = {
  device: LedDeviceInfo | null;
  reported: LedReported;
  onRotateToken: () => Promise<{ token: string; tokenPrefix: string }>;
  onRevokeToken: () => Promise<void>;
  onSaveCalibration: (groupCount: number, direction: 1 | -1) => Promise<void>;
  onProbeCalibration: (indices: number[], brightness?: number) => void;
};

export function LedSetupTab({
  device,
  reported,
  onRotateToken,
  onRevokeToken,
  onSaveCalibration,
  onProbeCalibration,
}: LedSetupTabProps) {
  const [probeIndex, setProbeIndex] = useState(device?.groupCount ?? 100);
  const [groupCount, setGroupCount] = useState(device?.groupCount ?? 1000);
  const [direction, setDirection] = useState<1 | -1>(device?.direction ?? 1);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleGenerate = async () => {
    setBusy(true);
    try {
      const res = await onRotateToken();
      setNewToken(res.token);
      toast.success("New Pi token generated — copy it now, it is shown only once.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-secondary/40 p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">
            Group Calibration
          </span>
          <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {device?.groupCount ?? 1000} {device?.groupCountProvisional ? "(provisional)" : "(verified)"}
          </span>
        </div>

        <p className="text-[11px] leading-snug text-muted-foreground">
          Light one group dimly to find the last controllable group on your 20 ft strip, then save the count.
        </p>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={1999}
            value={probeIndex}
            onChange={(e) => setProbeIndex(Math.max(0, Math.min(1999, Number(e.target.value) || 0)))}
            aria-label="Probe group index"
            className="w-24 rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-foreground"
          />
          <button
            type="button"
            onClick={() => onProbeCalibration([0, probeIndex], 18)}
            className="flex-1 rounded-lg border border-border bg-secondary px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-secondary-foreground active:scale-95"
          >
            Light group #{probeIndex}
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="number"
            min={1}
            max={2000}
            value={groupCount}
            onChange={(e) => setGroupCount(Math.max(1, Math.min(2000, Number(e.target.value) || 1)))}
            aria-label="Measured group count"
            className="w-24 rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-foreground"
          />
          <button
            type="button"
            onClick={() => setDirection((d) => (d === 1 ? -1 : 1))}
            className="rounded-lg border border-border bg-secondary px-2.5 py-1.5 font-mono text-[11px] text-secondary-foreground"
          >
            {direction === 1 ? "Dir: +" : "Dir: −"}
          </button>
          <button
            type="button"
            onClick={() => void onSaveCalibration(groupCount, direction)}
            className="flex-1 rounded-lg bg-foreground px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-background active:scale-95"
          >
            Save count
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-secondary/40 p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">
            Pi Controller (clockstation)
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {device?.hasToken ? `Key ${device.tokenPrefix}…` : "No key"}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleGenerate()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase text-secondary-foreground active:scale-95"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {device?.hasToken ? "Rotate key" : "Generate key"}
          </button>
          {device?.hasToken && (
            <button
              type="button"
              onClick={() => void onRevokeToken()}
              className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 py-1.5 font-mono text-[11px] uppercase text-muted-foreground active:scale-95"
            >
              <ShieldOff className="h-3.5 w-3.5" />
              Revoke
            </button>
          )}
        </div>

        {newToken && (
          <div className="flex items-center gap-2 rounded-lg border border-foreground/40 bg-background p-2">
            <code className="flex-1 truncate font-mono text-[10px] text-foreground">{newToken}</code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(newToken);
                toast.success("Copied token");
              }}
              aria-label="Copy token"
              className="rounded border border-border bg-secondary p-1 text-secondary-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <a
          href="/pi/led-controller-bundle.zip"
          download
          className="flex items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-background active:scale-95"
        >
          <Download className="h-3.5 w-3.5" />
          Download Pi controller (.zip)
        </a>

        <p className="font-mono text-[10px] leading-snug text-muted-foreground">
          {reported.controllerVersion ? `v${reported.controllerVersion}` : "Not yet connected"} · Cloud controls require internet; Pi keeps rendering last state offline.
        </p>
      </div>
    </div>
  );
}