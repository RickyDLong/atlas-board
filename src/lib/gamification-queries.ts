import type { SupabaseClient } from '@supabase/supabase-js';
import type { XPEvent, UserLevel, UserStreak, UserBadge } from '@/types/database';

/**
 * Gamification reads, with the Supabase client injected.
 *
 * The browser binds these to the anon client via gamification-actions.ts; the
 * award route binds them to the service-role client. Keeping the client out of
 * module scope is what lets the same query run on both sides.
 */

export async function getUserLevel(db: SupabaseClient, userId: string): Promise<UserLevel> {
  const { data } = await db
    .from('user_levels')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (data) return data as UserLevel;

  // Initialize if not exists
  const newLevel: Omit<UserLevel, 'updated_at'> = {
    user_id: userId,
    current_xp: 0,
    current_level: 1,
    title: 'Wanderer',
  };
  const { data: created, error } = await db
    .from('user_levels')
    .insert(newLevel)
    .select()
    .single();
  if (error) throw error;
  return created as UserLevel;
}

export async function getUserStreak(db: SupabaseClient, userId: string): Promise<UserStreak> {
  const { data } = await db
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (data) return data as UserStreak;

  const newStreak = {
    user_id: userId,
    current_streak: 0,
    longest_streak: 0,
    last_active_date: null,
    freeze_tokens: 0,
  };
  const { data: created, error } = await db
    .from('user_streaks')
    .insert(newStreak)
    .select()
    .single();
  if (error) throw error;
  return created as UserStreak;
}

export async function getUserBadges(db: SupabaseClient, userId: string): Promise<UserBadge[]> {
  const { data, error } = await db
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });
  if (error) throw error;
  return (data || []) as UserBadge[];
}

export async function getRecentXPEvents(db: SupabaseClient, userId: string, limit = 20): Promise<XPEvent[]> {
  const { data, error } = await db
    .from('user_xp_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as XPEvent[];
}

/** Get XP events for the contribution calendar (last N days) */
export async function getXPEventsByDay(db: SupabaseClient, userId: string, days = 140): Promise<Record<string, number>> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await db
    .from('user_xp_events')
    .select('xp_amount, created_at')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  const byDay: Record<string, number> = {};
  (data || []).forEach((evt: { xp_amount: number; created_at: string }) => {
    const day = evt.created_at.slice(0, 10);
    byDay[day] = (byDay[day] || 0) + evt.xp_amount;
  });
  return byDay;
}
