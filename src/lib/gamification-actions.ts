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
    title: 'Wanderer',
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
  freezeUsed: boolean;
  freezeTokensRemaining: number;
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
    metadata: {
      ...metadata,
      freeze_used: streakResult.freezeUsed,
    },
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
    freezeUsed: streakResult.freezeUsed,
    freezeTokensRemaining: streakResult.freezeTokensRemaining,
  };
}

// ─── Streak Management ──────────────────────────────────────

interface StreakUpdateResult {
  updated: boolean;
  currentStreak: number;
  freezeUsed: boolean;
  freezeTokensRemaining: number;
}

async function updateStreak(userId: string, streak: UserStreak): Promise<StreakUpdateResult> {
  const today = new Date().toISOString().slice(0, 10);
  const lastActive = streak.last_active_date;

  // Already active today
  if (lastActive === today) {
    return { updated: false, currentStreak: streak.current_streak, freezeUsed: false, freezeTokensRemaining: streak.freeze_tokens };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newStreak = streak.current_streak;
  let freezeTokens = streak.freeze_tokens;
  let freezeUsed = false;

  if (lastActive === yesterdayStr) {
    // Consecutive day — extend streak
    newStreak += 1;
  } else if (lastActive && lastActive < yesterdayStr) {
    // Missed at least one day
    const missedDays = Math.floor((new Date(today).getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)) - 1;
    if (missedDays === 1 && freezeTokens > 0) {
      // Use a freeze token to save the streak
      freezeTokens -= 1;
      freezeUsed = true;
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

  // Award freeze tokens at milestones (cap at 3)
  if (newStreak === 7 && streak.current_streak < 7) freezeTokens = Math.min(freezeTokens + 1, 3);
  if (newStreak === 14 && streak.current_streak < 14) freezeTokens = Math.min(freezeTokens + 1, 3);

  await supabase.from('user_streaks').update({
    current_streak: newStreak,
    longest_streak: longestStreak,
    last_active_date: today,
    freeze_tokens: freezeTokens,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);

  return { updated: true, currentStreak: newStreak, freezeUsed, freezeTokensRemaining: freezeTokens };
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
    existingKeys.add(key); // keep local set in sync for meta-badge counts
    newBadges.push(key);
  };

  const isCardComplete = action === 'card_complete' || action === 'card_complete_high' || action === 'card_complete_critical';

  // ─── Card Completion Checks ──────────────────────────────────
  if (isCardComplete) {
    // First Blood
    await tryAward('first_blood');

    const today = new Date().toISOString().slice(0, 10);

    // Count all completions (shared query, reused below)
    const { count: totalCompletions } = await supabase
      .from('user_xp_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('action', ['card_complete', 'card_complete_high', 'card_complete_critical']);

    const total = totalCompletions || 0;

    // Volume milestones
    if (total >= 10) await tryAward('ten_down');
    if (total >= 25) await tryAward('quarter_century');
    if (total >= 50) await tryAward('half_century');
    if (total >= 100) await tryAward('century_club');
    if (total >= 200) await tryAward('double_century');
    if (total >= 500) await tryAward('five_hundred');

    // Same-day completions
    const { count: todayCount } = await supabase
      .from('user_xp_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('action', ['card_complete', 'card_complete_high', 'card_complete_critical'])
      .gte('created_at', today + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59');

    const dayTotal = todayCount || 0;
    if (dayTotal >= 3) await tryAward('hat_trick');
    if (dayTotal >= 5) await tryAward('daily_double');
    if (dayTotal >= 10) await tryAward('berserker');
    if (dayTotal >= 20) await tryAward('unstoppable');

    // Critical-priority completions
    const { count: critCount } = await supabase
      .from('user_xp_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'card_complete_critical');

    const crit = critCount || 0;
    if (crit >= 10) await tryAward('crisis_manager');
    if (crit >= 25) await tryAward('fire_suppressor');

    // High-or-critical completions
    const { count: highCount } = await supabase
      .from('user_xp_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('action', ['card_complete_high', 'card_complete_critical']);

    if ((highCount || 0) >= 50) await tryAward('high_achiever');

    // Time-of-day badges
    const { data: allCompletionTimes } = await supabase
      .from('user_xp_events')
      .select('created_at')
      .eq('user_id', userId)
      .in('action', ['card_complete', 'card_complete_high', 'card_complete_critical']);

    const nightCount = (allCompletionTimes || []).filter(e => {
      const h = new Date(e.created_at).getHours();
      return h >= 0 && h < 4;
    }).length;
    const morningCount = (allCompletionTimes || []).filter(e => {
      const h = new Date(e.created_at).getHours();
      return h >= 5 && h < 8;
    }).length;
    if (nightCount >= 10) await tryAward('night_owl');
    if (morningCount >= 10) await tryAward('early_bird');

    // Subtask thoroughness
    if (ctx.metadata.all_subtasks_complete === true) {
      await tryAward('thorough');

      const { count: thoroughCount } = await supabase
        .from('user_xp_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('action', ['card_complete', 'card_complete_high', 'card_complete_critical'])
        .filter('metadata->>all_subtasks_complete', 'eq', 'true');

      if ((thoroughCount || 0) >= 25) await tryAward('perfectionist');
    }
  }

  // ─── Early Completion Checks ─────────────────────────────────
  if (action === 'card_early') {
    const { count: earlyCount } = await supabase
      .from('user_xp_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'card_early');

    const early = earlyCount || 0;
    if (early >= 1) await tryAward('first_spark');
    if (early >= 5) await tryAward('speed_demon');
    if (early >= 10) await tryAward('ember');
    if (early >= 25) await tryAward('blaze');
    if (early >= 50) await tryAward('inferno');
    if (early >= 100) await tryAward('conflagration');
  }

  // ─── On-Time Delivery Checks ─────────────────────────────────
  if (action === 'card_on_time') {
    const { count: onTimeCount } = await supabase
      .from('user_xp_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'card_on_time');

    const onTime = onTimeCount || 0;
    if (onTime >= 25) await tryAward('ahead_of_curve');
    if (onTime >= 50) await tryAward('clockwork');
    if (onTime >= 100) await tryAward('timekeeper');
  }

  // ─── Column Clear Checks ─────────────────────────────────────
  if (action === 'column_clear') {
    const { count: clearCount } = await supabase
      .from('user_xp_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'column_clear');

    const clears = clearCount || 0;
    if (clears >= 5) await tryAward('clean_sweep');
    if (clears >= 10) await tryAward('scorched_earth');
    if (clears >= 25) await tryAward('purge_master');
  }

  // ─── Archive Checks ──────────────────────────────────────────
  if (action === 'archive_batch') {
    const { count: archiveCount } = await supabase
      .from('user_xp_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'archive_batch');

    // Each archive_batch ≈ 10 cards archived
    const batches = archiveCount || 0;
    if (batches >= 3) await tryAward('archivist');     // ~25 cards
    if (batches >= 5) await tryAward('board_cleaner'); // ~50 cards
    if (batches >= 10) await tryAward('deep_archive'); // ~100 cards
  }

  // ─── Card Creation Checks ────────────────────────────────────
  if (action === 'card_create') {
    const { count: createCount } = await supabase
      .from('user_xp_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'card_create');

    const created = createCount || 0;
    if (created >= 50) await tryAward('world_builder');
    if (created >= 200) await tryAward('grand_creator');
  }

  // ─── Epic Complete Checks ────────────────────────────────────
  if (action === 'epic_complete') {
    await tryAward('epic_closer');

    const { count: epicCount } = await supabase
      .from('user_xp_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'epic_complete');

    const epics = epicCount || 0;
    if (epics >= 3) await tryAward('epic_hunter');
    if (epics >= 10) await tryAward('world_conqueror');
    if (epics >= 25) await tryAward('grand_architect');
  }

  // ─── Streak Badges ───────────────────────────────────────────
  if (ctx.streak >= 7) await tryAward('streak_starter');
  if (ctx.streak >= 14) await tryAward('fortnight');
  if (ctx.streak >= 21) await tryAward('steadfast');
  if (ctx.streak >= 30) await tryAward('monthly_machine');
  if (ctx.streak >= 90) await tryAward('iron_will');
  if (ctx.streak >= 180) await tryAward('half_year');
  if (ctx.streak >= 365) await tryAward('eternal_flame');

  // ─── Level Badges ────────────────────────────────────────────
  if (ctx.level >= 5) await tryAward('level_five');
  if (ctx.level >= 10) await tryAward('level_ten');
  if (ctx.level >= 20) await tryAward('level_twenty');
  if (ctx.level >= 30) await tryAward('level_thirty');
  if (ctx.level >= 40) await tryAward('level_forty');
  if (ctx.level >= 50) await tryAward('atlas_ascendant');

  // ─── Streak Freeze Badge ─────────────────────────────────────
  if (ctx.metadata.freeze_used === true) {
    await tryAward('ice_shield');
  }

  // ─── Daily Quest Badges ──────────────────────────────────────
  if (isCardComplete || action === 'card_create') {
    const { count: questTotal } = await supabase
      .from('daily_quests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true);

    const quests = questTotal || 0;
    if (quests >= 1) await tryAward('daily_duty');
    if (quests >= 30) await tryAward('devoted');
    if (quests >= 100) await tryAward('quest_master');

    const today = new Date().toISOString().slice(0, 10);
    const { count: todayQuestsDone } = await supabase
      .from('daily_quests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('date', today)
      .eq('completed', true);

    if ((todayQuestsDone || 0) >= 3) await tryAward('triple_threat');
  }

  // ─── Meta Badge (badge collection) ──────────────────────────
  // Run last so newly awarded badges are counted
  const totalBadges = existingKeys.size;
  if (totalBadges >= 10) await tryAward('decorated');
  if (totalBadges >= 20) await tryAward('trophy_room');
  if (totalBadges >= 30) await tryAward('completionist');

  return newBadges;
}

// ─── Convenience: Award XP for card completion ──────────────

export async function awardCardCompletionXP(
  userId: string,
  boardId: string,
  card: Card,
  extraMetadata: Record<string, unknown> = {},
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
    ...extraMetadata,
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
