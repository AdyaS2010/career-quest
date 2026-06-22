// Per-player preferences that don't need to live in the database to work.
// Kept in localStorage (same philosophy as wallet.ts / battles.ts) so the app
// works with zero schema changes; the profile editor also writes these to the
// `profiles` row best-effort, so they sync across devices once those optional
// columns exist.

export interface UserPrefs {
  showOnLeaderboard: boolean;
  tz: string; // 'auto' (device clock) or a GMT offset in hours, e.g. '0', '+5.5', '-8'
}

const DEFAULTS: UserPrefs = { showOnLeaderboard: true, tz: 'auto' };
const key = (uid: string) => `questford_prefs_${uid}`;

export function loadPrefs(uid: string): UserPrefs {
  try {
    const raw = localStorage.getItem(key(uid));
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<UserPrefs>) };
  } catch { return { ...DEFAULTS }; }
}

export function savePrefs(uid: string, p: UserPrefs): void {
  try { localStorage.setItem(key(uid), JSON.stringify(p)); } catch { /* ignore */ }
}

// The current moment, shifted into the player's chosen timezone. 'auto' keeps
// the device's own local time, otherwise we rebuild from UTC + the GMT offset.
export function nowInTz(tz: string): Date {
  if (!tz || tz === 'auto') return new Date();
  const offsetHours = parseFloat(tz);
  if (Number.isNaN(offsetHours)) return new Date();
  const utcMs = Date.now() + new Date().getTimezoneOffset() * 60000;
  return new Date(utcMs + offsetHours * 3600000);
}

const fmtOffset = (h: number): string => {
  const sign = h < 0 ? '-' : '+';
  const abs = Math.abs(h);
  const hh = Math.floor(abs);
  const mm = Math.round((abs - hh) * 60);
  return `GMT${sign}${hh}${mm ? ':' + String(mm).padStart(2, '0') : ''}`;
};

const OFFSETS = [-12, -11, -10, -9, -8, -7, -6, -5, -4, -3.5, -3, -2, -1, 0, 1, 2, 3, 3.5, 4, 4.5, 5, 5.5, 5.75, 6, 6.5, 7, 8, 9, 9.5, 10, 11, 12, 13];

export const TZ_OPTIONS: { label: string; value: string }[] = [
  { label: 'Auto — use my device', value: 'auto' },
  ...OFFSETS.map(h => ({ label: fmtOffset(h), value: (h >= 0 ? '+' : '') + h })),
];

export function tzLabel(tz: string): string {
  return TZ_OPTIONS.find(o => o.value === tz)?.label ?? 'Auto — use my device';
}
