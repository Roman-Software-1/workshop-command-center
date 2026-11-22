export const MUSIC_MODAL_IDLE_MS = 30_000;
export const clampVolume = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
