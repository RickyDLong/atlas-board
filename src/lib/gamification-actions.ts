import { createClient } from '@/lib/supabase/client';
import type { XPEvent, UserLevel, UserStreak, UserBadge, XPAction, Card } from '@/types/database';
import {
  XP_VALUES,
  PRIORITY_XP_MULTIPLIER,
  STREAK_XP_MULTIPLIER,
  LEVEL_TITLES,
} from '@/types/database';

const supabase = createClient();

// ─── XP Curve ───────────────────────────────────────────────

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
  return entry?.title || 'Recruit';
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

// ─── Data Fetching ──────────────────────────────────────────

export async function getUserLevel(userId: string): Promise<UserLevel> {
  const { data } = await supabase
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
    title: 'Recruit',
  };
  const { data: created, error } = await supabase
    .from('user_levels')
    .insert(newLevel)
    .select()
    .single();
  if (error) throw error;
  return created as UserLevel;
}

export async function getUserStreak(userId: string): Promise<UserStreak> {
  const { data } = await supabase
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
  const { data: created, error } = await supabase
    .from('user_streaks')
    .insert(newStreak)
    .select()
    .single();
  if (error) throw error;
  return created as UserStreak;
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });
  if (error) throw error;
  return (data || []) as UserBadge[];
}

export async function getRecentXPEvents(userId: string, limit = 20): Promise<XPEvent[]> {
  const { data, error } = await supabase
    .from('user_xp_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as XPEvent[];
}

/** Get XP events for the contribution calendar (last N days) */
export async function getXPEventsByDay(userId: string, days = 140): Promise<Record<string, number>> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
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

// ─── XP Engine ──────────────────────────────────────────────

export interface XPAwardResult {
  xpAwarded: number;
  action: XPAction;
  newTotalXP: number;
  newLevel: number;
  previousLevel: number;
  leveledUp: boolean;
  newTitle: string;
  newBadges: string[];
  streakUpdated: boolean;
  currentStreak: number;
}

export async function awardXP(
  userId: string,
  boardId: string,
  action: XPAction,
  metadata: Record<string, unknown> = {},
): Promise<XPAwardResult> {
  // Get current state
  const [level, streak] = await Promise.all([
    getUserLevel(userId),
    getUserStreak(userId),
  ]);

  const previousLevel = level.current_level;

  // Calculate base XP
  let baseXP = XP_VALUES[action] || 0;

  // Apply priority multiplier for card completions
  if (metadata.priority && (action === 'card_complete' || action === 'card_complete_high' || action === 'card_complete_critical')) {
    baseXP = Math.floor(baseXP * (PRIORITY_XP_MULTIPLIER[metadata.priority as string] || 1.0));
  }

  // Apply streak multiplier
  const streakMult = getStreakMultiplier(streak.current_streak);
  const xpAwarded = Math.floor(baseXP * streakMult);

  // Record XP event
  await supabase.from('user_xp_events').insert({
    user_id: userId,
    board_id: boardId,
    action,
    xp_amount: xpAwarded,
    metadata: { ...metadata, streak_multiplier: streakMult },
  });

  // Update total XP and level
  const newTotalXP = level.current_xp + xpAwarded;
  const newLevel = levelFromXP(newTotalXP);
  const newTitle = titleForLevel(newLevel);
  const leveledUp = newLevel > previousLevel;

  await supabase.from('user_levels').update({
    current_xp: newTotalXP,
    current_level: newLevel,
    title: newTitle,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);

  // Update streak
  const streakResult = await updateStreak(userId, streak);

  // Check badges
  const newBadges = await checkAndAwardBadges(userId, boardId, action, {
    totalXP: newTotalXP,
    level: newLevel,
    streak: streakResult.currentStreak,
    metadata,
  });

  return {
    xpAwarded,
    action,
    newTotalXP,
    newLevel,
    previousLevel,
    leveledUp,
    newTitle,
    newBadges,
    streakUpdated: streakResult.updated,
    currentStreak: streakResult.currentStreak,
  };
}

// ─── Streak Management ──────────────────────────────────────

async function updateStreak(userId: string, streak: UserStreak): Promise<{ updated: boolean; currentStreak: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const lastActive = streak.last_active_date;

  // Already active today
  if (lastActive === today) {
    return { updated: false, currentStreak: streak.current_streak };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newStreak = streak.current_streak;
  let freezeTokens = streak.freeze_tokens;

  if (lastActive === yesterdayStr) {
    // Consecutive day — extend streak
    newStreak += 1;
  } else if (lastActive && lastActive < yesterdayStr) {
    // Missed at least one day
    const missedDays = Math.floor((new Date(today).getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)) - 1;
    if (missedDays === 1 && freezeTokens > 0) {
      // Use a freeze token
      freezeTokens -= 1;
      newStreak += 1;
    } else {
      // Reset streak
      newStreak = 1;
    }
  } else {
    // First ever activity
    newStreak = 1;
  }

  const longestStreak = Math.max(streak.longest_streak, newStreak);

  // Award freeze tokens at milestones
  if (newStreak === 7 && streak.current_streak < 7) freezeTokens = Math.min(freezeTokens + 1, 3);
  if (newStreak === 14 && streak.current_streak < 14) freezeTokens = Math.min(freezeTokens + 1, 3);

  await supabase.from('user_streaks').update({
    current_streak: newStreak,
    longest_streak: longestStreak,
    last_active_date: today,
    freeze_tokens: freezeTokens,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);

  return { updated: true, currentStreak: newStreak };
}

// ─── Badge Engine ───────────────────────────────────────────

interface BadgeCheckContext {
  totalXP: number;
  level: number;
  streak: number;
  metadata: Record<string, unknown>;
}

async function checkAndAwardBadges(
  userId: string,
  boardId: string,
  action: XPAction,
  ctx: BadgeCheckContext,
): Promise<string[]> {
  const existing = await getUserBadges(userId);
  const existingKeys = new Set(existing.map(b => b.badge_key));
  const newBadges: string[] = [];

  const tryAward = async (key: string) => {
    if (existingKeys.has(key)) return;
    await supabase.from('user_badges').insert({
      user_id: userId,
      badge_key: key,
    });
    newBadges.push(key);
  };

  // First Blood: complete your first card
  if (action === 'card_complete' || action === 'card_complete_high' || action === 'card_complete_critical') {
    await tryAward('first_blood');
  }

  // Hat Trick: 3 completions in one day
  if (action === 'card_complete' || action === 'card_complete_high' || action === 'card_complete_critical') {
    const today = new Date().toISOString().slice(0, 10);
    const { count } = await supabase
      .from('user_xp_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('action', ['card_complete', 'card_complete_high', 'card_complete_critical'])
      .gte('created_at', today + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59');
    if ((count || 0) >= 3) await tryAward('hat_trick');
  }

  // Streak badges
  if (ctx.streak >= 7) await tryAward('streak_starter');
  if (ctx.streak >= 30) await tryAward('monthly_machine');
  if (ctx.streak >= 90) await tryAward('iron_will');

  // Level badges
  if (ctx.level >= 50) await tryAward('atlas_ascendant');

  // Epic complete
  if (action === 'epic_complete') await tryAward('epic_closer');

  // Archive batch
  if (action === 'archive_batch') {
    const { count } = await supabase
      .from('user_xp_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'archive_batch');
    // Each archive_batch event is for 10 cards, so 5 events = 50 cards
    if ((count || 0) >= 5) await tryAward('board_cleaner');
  }

  // Century Club: 100 total completions
  if (action === 'card_complete' || action === 'card_complete_high' || action === 'card_complete_critical') {
    const { count } = await supabase
      .from('user_xp_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('action', ['card_complete', 'card_complete_high', 'card_complete_critical']);
    if ((count || 0) >= 100) await tryAward('century_club');
  }

  // Speed Demon: check metadata for early completions count
  if (action === 'card_early') {
    const { count } = await supabase
      .from('user_xp_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'card_early');
    if ((count || 0) >= 5) await tryAward('speed_demon');
  }

  return newBadges;
}

// ─── Convenience: Award XP for card completion ──────────────

export async function awardCardCompletionXP(
  userId: string,
  boardId: string,
  card: Card,
  _doneColumnId: string,
): Promise<XPAwardResult | null> {
  // Only award when moving TO done column
  // Determine the right action based on priority
  let action: XPAction = 'card_complete';
  if (card.priority === 'critical') action = 'card_complete_critical';
  else if (card.priority === 'high') action = 'card_complete_high';

  const result = await awardXP(userId, boardId, action, {
    card_id: card.id,
    card_title: card.title,
    priority: card.priority,
  });

  // Check on-time/early bonuses
  if (card.due_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(card.due_date + 'T00:00:00');
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0) {
      // On time
      await awardXP(userId, boardId, 'card_on_time', { card_id: card.id });
    }
    if (diffDays > 1) {
      // Early
      await awardXP(userId, boardId, 'card_early', { card_id: card.id });
    }
  }

  return result;
}
