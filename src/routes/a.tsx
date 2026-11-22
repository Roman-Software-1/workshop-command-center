import { createFileRoute } from "@tanstack/react-router";
import { Frame } from "@/components/panel/Frame";
import { usePanel } from "@/components/panel/usePanel";
import { VariantA } from "@/components/panel/VariantA";
import { useSuspenseQuery } from "@tanstack/react-query";
import { rizeTotalsQuery } from "@/lib/rize.queries";

export const Route = createFileRoute("/a")({
  loader: ({ context }) => context.queryClient.ensureQueryData(rizeTotalsQuery),
  head: () => ({
    meta: [
      { title: "Workshop Panel — Instrument Panel" },
      { name: "description", content: "Workshop touchscreen panel, Instrument Panel style." },
      { property: "og:title", content: "Workshop Panel — Instrument Panel" },
      { property: "og:description", content: "Workshop touchscreen panel, Instrument Panel style." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const p = usePanel({ sync: true });
  const { data } = useSuspenseQuery(rizeTotalsQuery);
  return (
    <Frame status={p.status} variant="a">
      <VariantA p={p} rize={data} />
    </Frame>
  );
}
