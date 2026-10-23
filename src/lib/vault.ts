export interface VaultStatus {
  unlocked: boolean;
  remainingMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  valid: boolean;
}

/** Locked until releaseDate; unlocks automatically once `now` passes it. Invalid dates stay locked. */
export function vaultStatus(releaseDateIso: string, now: number = Date.now()): VaultStatus {
  const t = Date.parse(releaseDateIso);
  if (Number.isNaN(t)) return { unlocked: false, remainingMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, valid: false };
  const remainingMs = Math.max(0, t - now);
  const s = Math.floor(remainingMs / 1000);
  return {
    unlocked: remainingMs === 0,
    remainingMs,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    valid: true,
  };
}
