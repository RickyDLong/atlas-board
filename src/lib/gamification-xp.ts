import { STREAK_XP_MULTIPLIER, LEVEL_TITLES } from '@/constants/gamification';

/**
 * The XP curve: pure math, no Supabase client.
 *
 * Deliberately free of any client binding so both the browser (via
 * gamification-actions.ts) and the server award engine can import it.
 */

/** XP required to advance FROM a given level to the next */
export function xpForLevel(level: number): number {
  return Math.floor(80 * Math.pow(level, 1.5) + 20 * level);
}

/** Total cumulative XP to reach a level from 0 */
export function totalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

/** Determine level from total XP */
export function levelFromXP(totalXP: number): number {
  let level = 1;
  let accumulated = 0;
  while (accumulated + xpForLevel(level) <= totalXP) {
    accumulated += xpForLevel(level);
    level++;
    if (level > 50) break;
  }
  return Math.min(level, 50);
}

/** Get the title for a given level */
export function titleForLevel(level: number): string {
  const entry = LEVEL_TITLES.find(t => level >= t.minLevel);
  return entry?.title || 'Wanderer';
}

/** Get the color for a given level */
export function colorForLevel(level: number): string {
  const entry = LEVEL_TITLES.find(t => level >= t.minLevel);
  return entry?.color || '#8888a0';
}

/** Get streak multiplier */
export function getStreakMultiplier(streakDays: number): number {
  const entry = STREAK_XP_MULTIPLIER.find(s => streakDays >= s.minDays);
  return entry?.multiplier || 1.0;
}
