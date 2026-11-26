import { createFileRoute } from "@tanstack/react-router";
import { LED_DEVICE_ID } from "@/lib/led-schema";

export const Route = createFileRoute("/api/public/led/device/poll")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { authenticateDevice, pollForDevice } = await import("@/lib/led.server");
        const ok = await authenticateDevice(request, LED_DEVICE_ID);
        if (!ok) {
          return Response.json({ error: "Unauthorized device token" }, { status: 401 });
        }
        const url = new URL(request.url);
        const since = Math.max(0, Number.parseInt(url.searchParams.get("since") ?? "0", 10) || 0);
        const wait = Math.max(0, Math.min(25_000, Number.parseInt(url.searchParams.get("wait") ?? "20000", 10) || 20_000));
        try {
          const data = await pollForDevice(LED_DEVICE_ID, since, wait);
          return Response.json(data, { headers: { "Cache-Control": "no-store" } });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Poll failed";
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});