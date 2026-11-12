import { createFileRoute } from "@tanstack/react-router";
import { Frame } from "@/components/panel/Frame";
import { usePanel } from "@/components/panel/usePanel";
import { VariantC } from "@/components/panel/VariantC";

export const Route = createFileRoute("/c")({
  head: () => ({
    meta: [
      { title: "Workshop Panel — Clean Minimal" },
      { name: "description", content: "Workshop touchscreen panel, Clean Minimal style." },
      { property: "og:title", content: "Workshop Panel — Clean Minimal" },
      { property: "og:description", content: "Workshop touchscreen panel, Clean Minimal style." },
    ],
  }),
  component: Page,
});

function Page() {
  const p = usePanel();
  return (
    <Frame status={p.status} variant="c">
      <VariantC p={p} />
    </Frame>
  );
}
