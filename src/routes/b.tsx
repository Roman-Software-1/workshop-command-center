import { createFileRoute } from "@tanstack/react-router";
import { Frame } from "@/components/panel/Frame";
import { usePanel } from "@/components/panel/usePanel";
import { VariantB } from "@/components/panel/VariantB";

export const Route = createFileRoute("/b")({
  head: () => ({
    meta: [
      { title: "Workshop Panel — Big Tiles" },
      { name: "description", content: "Workshop touchscreen panel, Big Tiles style." },
      { property: "og:title", content: "Workshop Panel — Big Tiles" },
      { property: "og:description", content: "Workshop touchscreen panel, Big Tiles style." },
    ],
  }),
  component: Page,
});

function Page() {
  const p = usePanel();
  return (
    <Frame status={p.status} variant="b">
      <VariantB p={p} />
    </Frame>
  );
}
