// Sun event times (NOAA-style approximation). Pure, no network.
export type Place = { name: string; lat: number; lon: number; timeZone: string };

const rad = Math.PI / 180;

/** UTC Date when the sun crosses `altitude` degrees on the given day; null if it never does. */
export function sunTime(date: Date, lat: number, lon: number, altitude: number, rising: boolean): Date | null {
  const day0 = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const n = Math.ceil(day0 / 864e5 + 2440587.5 - 2451545 + 0.0008);
  const J = n - lon / 360;
  const M = (357.5291 + 0.98560028 * J) % 360;
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const L = (M + C + 180 + 102.9372) % 360;
  const transit = 2451545 + J + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad);
  const dec = Math.asin(Math.sin(L * rad) * Math.sin(23.44 * rad));
  const cosH = (Math.sin(altitude * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec));
  if (cosH < -1 || cosH > 1) return null;
  const H = Math.acos(cosH) / rad / 360;
  const jd = rising ? transit - H : transit + H;
  return new Date((jd - 2440587.5) * 864e5);
}

/** Minutes after local midnight in a time zone. */
export function minutesInZone(d: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

export type DayLight = { nauticalDawn: number; civilDawn: number; sunrise: number; sunset: number; civilDusk: number; nauticalDusk: number };

export function daylightFor(date: Date, place: Place): DayLight {
  const m = (alt: number, rising: boolean, fallback: number) => {
    const t = sunTime(date, place.lat, place.lon, alt, rising);
    return t ? minutesInZone(t, place.timeZone) : fallback;
  };
  return {
    nauticalDawn: m(-12, true, 0), civilDawn: m(-6, true, 0), sunrise: m(-0.833, true, 0),
    sunset: m(-0.833, false, 1440), civilDusk: m(-6, false, 1440), nauticalDusk: m(-12, false, 1440),
  };
}
