import { createFileRoute } from "@tanstack/react-router";
import { LED_DEVICE_ID } from "@/lib/led-schema";

export const Route = createFileRoute("/api/public/led/device/report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authenticateDevice, recordDeviceReport } = await import("@/lib/led.server");
        const ok = await authenticateDevice(request, LED_DEVICE_ID);
        if (!ok) {
          return Response.json({ error: "Unauthorized device token" }, { status: 401 });
        }
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }
        try {
          const res = await recordDeviceReport(LED_DEVICE_ID, body);
          return Response.json(res, { headers: { "Cache-Control": "no-store" } });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Invalid report payload";
          return Response.json({ error: msg }, { status: 400 });
        }
      },
    },
  },
});