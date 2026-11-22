<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Keep design A at the physical screen's native dimensions, using layout spacing rather than transforms or stretched content; B and C remain legacy design previews.
- Frost status feedback only in design A, using standard backdrop-filter; unmount feedback after its finite animation with a timeout fallback so the dashboard never stays blurred.
- Rize totals use a no-input public server function, a server-only fixed summary query, explicit aggregate projection, and a 60-second cache; this prevents provider credentials and detailed activity from reaching public clients.
- Design A reads Rize via a route loader and TanStack Query with minute refreshes; legacy designs keep samples, and connected read failures must never fall back to fabricated totals.
- Account state has one root AuthProvider subscriber; the public /auth page reads and updates only the signed-in user's profile through RLS, keeping the kiosk and Rize totals public.
