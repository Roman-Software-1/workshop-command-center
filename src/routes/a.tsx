import { createFileRoute } from "@tanstack/react-router";
import { Frame } from "@/components/panel/Frame";
import { usePanel } from "@/components/panel/usePanel";
import { VariantA } from "@/components/panel/VariantA";

export const Route = createFileRoute("/a")({
  head: () => ({
    meta: [
      { title: "Workshop Panel — Instrument Panel" },
      { name: "description", content: "Workshop touchscreen panel, Instrument Panel style." },
      { property: "og:title", content: "Workshop Panel — Instrument Panel" },
      { property: "og:description", content: "Workshop touchscreen panel, Instrument Panel style." },
    ],
  }),
  component: Page,
});

function Page() {
  const p = usePanel();
  return (
    <Frame status={p.status} variant="a">
      <VariantA p={p} />
    </Frame>
  );
}
