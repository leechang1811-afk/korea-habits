/**
 * Streak tracking for retention.
 * Uses localStorage: last_play_date (YYYY-MM-DD), streak_count
 */

const KEY_DATE = 'streak_last_play_date';
const KEY_COUNT = 'streak_count';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

function daysBetween(a: string, b: string): number {
  const d1 = parseDate(a).getTime();
  const d2 = parseDate(b).getTime();
  return Math.round((d2 - d1) / (24 * 60 * 60 * 1000));
}

export interface StreakState {
  count: number;
  playedToday: boolean;
  canExtend: boolean; // true if user played yesterday (streak continues today)
}

export function getStreakState(): StreakState {
  if (typeof window === 'undefined') {
    return { count: 0, playedToday: false, canExtend: false };
  }
  const today = todayStr();
  const last = localStorage.getItem(KEY_DATE);
  const count = parseInt(localStorage.getItem(KEY_COUNT) ?? '0', 10);

  if (!last) {
    return { count: 0, playedToday: false, canExtend: false };
  }

  const days = daysBetween(last, today);

  if (days === 0) {
    return { count, playedToday: true, canExtend: false };
  }
  if (days === 1) {
    return { count, playedToday: false, canExtend: true };
  }
  return { count: 0, playedToday: false, canExtend: false };
}

/** Call when user completes a run. Returns new streak count. */
export function recordPlay(): number {
  if (typeof window === 'undefined') return 0;
  const today = todayStr();
  const last = localStorage.getItem(KEY_DATE);
  const count = parseInt(localStorage.getItem(KEY_COUNT) ?? '0', 10);

  let newCount: number;
  if (!last) {
    newCount = 1;
  } else {
    const days = daysBetween(last, today);
    if (days === 0) newCount = count; // already played today
    else if (days === 1) newCount = count + 1;
    else newCount = 1;
  }

  localStorage.setItem(KEY_DATE, today);
  localStorage.setItem(KEY_COUNT, String(newCount));
  return newCount;
}
