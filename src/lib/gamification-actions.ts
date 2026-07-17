import { createClient } from '@/lib/supabase/client';
import type { XPEvent, UserLevel, UserStreak, UserBadge } from '@/types/database';
import * as queries from '@/lib/gamification-queries';

/**
 * Browser-side gamification: reads bound to the anon client, plus a re-export
 * of the XP curve math for existing callers.
 *
 * Awards are NOT here — they run server-side in gamification-award.ts behind
 * /api/gamification/award, since migration 028 revoked client write access to
 * the gamification tables.
 */

const supabase = createClient();

export {
  xpForLevel,
  totalXPForLevel,
  levelFromXP,
  titleForLevel,
  colorForLevel,
  getStreakMultiplier,
} from '@/lib/gamification-xp';

// ─── Data Fetching ──────────────────────────────────────────

export function getUserLevel(userId: string): Promise<UserLevel> {
  return queries.getUserLevel(supabase, userId);
}

export function getUserStreak(userId: string): Promise<UserStreak> {
  return queries.getUserStreak(supabase, userId);
}

export function getUserBadges(userId: string): Promise<UserBadge[]> {
  return queries.getUserBadges(supabase, userId);
}

export function getRecentXPEvents(userId: string, limit = 20): Promise<XPEvent[]> {
  return queries.getRecentXPEvents(supabase, userId, limit);
}

/** Get XP events for the contribution calendar (last N days) */
export function getXPEventsByDay(userId: string, days = 140): Promise<Record<string, number>> {
  return queries.getXPEventsByDay(supabase, userId, days);
}
