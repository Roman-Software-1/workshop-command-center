# Music pop-up (Apple-style)

Tapping the song box opens a large card in the center of design A. The rest of the dashboard is frosted/blurred and dimmed. Tap outside, swipe down, or tap the X to close. It also closes on its own after 30 seconds of no touches so the dashboard never stays hidden.

## What's in the pop-up

```text
+--------------------------------------------------+
|  [ big album art ]   Song title                 X |
|                      Artist · Album               |
|                      ━━━━━━━━●────── 1:42 / 3:58  |
|                                                   |
|        [shuffle] [prev] [ PLAY ] [next] [repeat]  |
|                                                   |
|  Volume  ─────────●──────   [-] [+]               |
|  Playing on: [ iPhone v ]  (switch device)        |
|                                                   |
|  Quick playlists:  [Focus] [Shop Mix] [Chill] [+] |
|  Up next: Song A · Song B · Song C                |
+--------------------------------------------------+
```

Helpful options (all big, glove-friendly buttons):
1. Large controls: previous, play/pause, next, shuffle, repeat.
2. Tap-to-seek progress bar.
3. Volume slider with big +/- buttons.
4. Device picker: move music between phone, computer, workshop speaker.
5. Quick playlists: 3-4 favorite playlists one tap away (focus, shop, chill).
6. Up next: the next three songs.
7. Like button: save the current song to Liked Songs.
8. Auto-quiet: optional switch that pauses music when you clock out and lowers it on break.

Only you (signed in) can use the buttons; others just see the song.

## Technical details
- New `SpotifyModal` rendered in VariantA; reuse the existing frost style (backdrop-filter blur, dim layer); fits 1024x600 (about 720x440 card), short fade/scale-in only.
- Extend `spotifyControl` (owner-only) with: shuffle, repeat, seek, volume, transfer device, play playlist, save track.
- New owner-only reads: devices, queue. Public now-playing stays limited to song/artist/art/progress.
- Liking songs needs one extra Spotify permission (`user-library-modify`), so you'd reconnect Spotify once.
- Quick playlists stored in your saved profile.
- Tests for new control validation and auto-close timer.
