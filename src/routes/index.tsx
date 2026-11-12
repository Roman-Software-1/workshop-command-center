import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workshop Panel — Pick a design" },
      { name: "description", content: "Three design options for the 1024x600 workshop touchscreen." },
      { property: "og:title", content: "Workshop Panel — Pick a design" },
      { property: "og:description", content: "Three design options for the 1024x600 workshop touchscreen." },
    ],
  }),
  component: Index,
});

const OPTIONS = [
  { to: "/a", name: "A · Instrument Panel", note: "Mono numbers, thin rules, gauge feel" },
  { to: "/b", name: "B · Big Tiles", note: "Chunky, glove-friendly buttons" },
  { to: "/c", name: "C · Clean Minimal", note: "Big clock, calm and spacious" },
] as const;

function Index() {
  return (
    <div className="panel-root flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-8 font-sans text-foreground" data-status="in">
      <h1 className="font-display text-4xl">Workshop Panel</h1>
      <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
        {OPTIONS.map((o) => (
          <Link key={o.to} to={o.to} className="rounded-2xl border border-border bg-card p-6 hover:border-primary">
            <div className="text-lg font-bold">{o.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">{o.note}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
