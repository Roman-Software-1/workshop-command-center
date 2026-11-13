# Repair the existing Spotify connection

## Goal
Make the existing Spotify connection ask for your Spotify app credentials securely first, then send you to Spotify to approve access. No new sign-in screen is added to the workshop display.

## Steps
1. Inspect the existing Spotify connection entry to confirm it has no app credentials attached (the cause of the "missing client_id/client_secret" error).
2. Attach your Spotify app credentials to that same entry through the secure credential card (you paste the client ID and a freshly reset secret there; they never go through chat).
3. Confirm the redirect address Spotify needs, and tell you exactly what to add in your Spotify developer dashboard.
4. Re-open the existing Spotify connect card so you approve access on Spotify.
5. If the connection still fails at the same point, stop and report the exact error rather than building workarounds.
6. Once connected, replace the sample music widget on screen A with a read-only "now playing" display (same size and spot, no controls).

## Technical details
- Use the app-user connector tools on the existing `udc_spotify` entry (configure its OAuth client) instead of creating a new connector or custom OAuth.
- Scopes: `user-read-currently-playing`, `user-read-playback-state`.
- Widget reads the current track via a server function; credentials stay server-side.
- Update roadmap.md as each blocker clears.
