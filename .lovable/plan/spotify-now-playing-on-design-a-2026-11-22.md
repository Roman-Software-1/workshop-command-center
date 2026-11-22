# Spotify "Now Playing" on design A

## How it will work
- Right now the Spotify box is just Spotify's standard player for one playlist. It does not know what you're listening to.
- After this change, it shows whatever your Spotify account is playing on your phone or computer: song, artist, album art, and a progress bar.
- Touch buttons control that device: previous, play/pause, next.
- It checks for a new song every few seconds. If nothing is playing, it shows "Nothing playing". If Spotify can't be reached, it says so and never shows a fake song.
- Only your Spotify account is used. The song info is shown on the screen, but only you, signed in, can use the controls.

## Steps
1. Connect your Spotify account with the secure Spotify connection card. You approve access once.
2. Replace the current Spotify box with a "Now Playing" card that's the same size, so the 1024x600 layout stays the same.
3. Check it on the screen while music plays on your phone.

## Technical details
- Use the existing shared-account Spotify playback connector, linked to the project; credentials stay on the server only.
- Public server function `getNowPlaying` (GET /me/player/currently-playing) returns only these fields: title, artists, album art URL, progress, duration, isPlaying. It caches for 3 seconds.
- Authenticated server functions for play/pause/next/previous (requireSupabaseAuth). Buttons are disabled when signed out.
- TanStack Query polls every 5s; progress bar interpolates locally between polls.
- Note: Spotify control features require Premium (you have it).
