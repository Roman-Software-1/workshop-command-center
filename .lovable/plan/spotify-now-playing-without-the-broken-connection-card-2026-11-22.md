# Spotify "Now Playing" without the broken connection card

The Lovable Spotify connection card won't load, so the dashboard will sign in to Spotify on its own using your Spotify developer app.

## What you'll do (one time)
1. In the Spotify Developer Dashboard, open your app, **reset the client secret** (the old one was shared in chat), and add this Redirect URI:
   `https://benchside-status-bloom.lovable.app/api/public/spotify/callback` (and the preview URL version).
2. Enter your Client ID and new secret into the secure form I'll show you.
3. Sign in on the dashboard and tap "Connect Spotify". Approve once.

## What you'll see
- Song, artist, album art, and progress bar for whatever's playing on your phone or computer, updated every 5 seconds.
- Previous / play-pause / next buttons. They only work when you're signed in.
- "Nothing playing" when idle, and an honest error if Spotify can't be reached. It never shows a fake song.
- Same card size, so the 1024x600 layout stays the same.

## Technical details
- Secrets: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET (server-only).
- Table `spotify_tokens` (single row: refresh_token, access_token, expires_at). RLS is enabled with no client policies, and it's accessed only by the server through the admin client.
- Authenticated server fn `startSpotifyAuth` returns the authorize URL (scopes: user-read-currently-playing, user-read-playback-state, user-modify-playback-state) with a signed state tied to the user id.
- Server route `/api/public/spotify/callback` verifies the signed state, exchanges the code, and stores the tokens.
- Server helper refreshes the access token when expired.
- Public `getNowPlaying` returns only these fields: title, artists, art, progress, duration, isPlaying. It caches for 3 seconds.
- Authenticated `spotifyControl({action})` for play/pause/next/previous.
- Query polls every 5s; progress interpolates locally.
- Tests: state signature validation, and now-playing projection strips extra fields.
