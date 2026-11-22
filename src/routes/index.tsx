import { createFileRoute, redirect } from "@tanstack/react-router";

export function openDefaultPanel() {
  throw redirect({ to: "/a", replace: true });
}

export const Route = createFileRoute("/")({
  beforeLoad: openDefaultPanel,
  head: () => ({
    meta: [
      { title: "Workshop Panel — Workshop display" },
      { name: "description", content: "Live workshop hours, focus totals, and work status on screen A." },
      { property: "og:title", content: "Workshop Panel — Workshop display" },
      { property: "og:description", content: "Live workshop hours, focus totals, and work status on screen A." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
