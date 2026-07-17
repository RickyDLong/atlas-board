import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserStreak, XPAction, XPAwardResult, Card } from '@/types/database';
import {
  XP_VALUES,
  PRIORITY_XP_MULTIPLIER,
} from '@/constants/gamification';
import { getStreakMultiplier, levelFromXP, titleForLevel } from '@/lib/gamification-xp';
import { getUserLevel, getUserStreak, getUserBadges } from '@/lib/gamification-queries';

/**
 * The XP award engine.
 *
 * Import this from server code only. It takes an injected client and is meant to
 * run with the service-role key behind /api/gamification/award, because RLS
 * (migration 028) no longer lets clients write the gamification tables. Handing
 * it an anon client would simply fail every write.
 *
 * Every award carries a dedupe_key backed by a unique index, so replaying an
 * action (re-entering the done column, undo/redo, re-completing an epic) is a
 * no-op rather than a second payout.
 */

/**
 * Clock context for an award.
 *
 * `todayUtc` is derived server-side. Streaks and daily caps have always keyed
 * off the UTC date (the old client code used toISOString().slice(0, 10)), so
 * computing it here preserves the existing day boundary and keeps the client
 * from being able to shift it.
 *
 * `tzOffsetMinutes` is the browser's Date#getTimezoneOffset. It only affects
 * which hour-of-day a completion is attributed to, for the night_owl and
 * early_bird badges, which have always used the user's local hours.
 */
export interface AwardClock {
  todayUtc: string;
  tzOffsetMinutes: number;
}

/** Build the clock for an award. The date is deliberately not client-supplied. */
export function awardClock(tzOffsetMinutes: number): AwardClock {
  return { todayUtc: new Date().toISOString().slice(0, 10), tzOffsetMinutes };
}

/** Idempotency keys. Card completion is deliberately not priority-specific, so
 *  editing a card's priority and re-completing it cannot mint a second award. */
export const dedupeKeys = {
  cardComplete: (cardId: string) => `card_complete:${cardId}`,
  cardOnTime: (cardId: string) => `card_on_time:${cardId}`,
  cardEarly: (cardId: string) => `card_early:${cardId}`,
  epicComplete: (epicId: string) => `epic_complete:${epicId}`,
  cardCreate: (date: string) => `card_create:${date}`,
  archiveBatch: (date: string) => `archive_batch:${date}`,
};

const POSTGRES_UNIQUE_VIOLATION = '23505';

/** Hour-of-day in the user's timezone, for the night_owl / early_bird badges. */
function localHour(iso: string, tzOffsetMinutes: number): number {
  return new Date(new Date(iso).getTime() - tzOffsetMinutes * 60_000).getUTCHours();
}

function shiftDate(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Award XP for an action. Returns null when the award was already granted —
 * the caller should treat that as "nothing happened" and show no toast.
 */
export async function awardXP(
  db: SupabaseClient,
  userId: string,
  boardId: string,
  action: XPAction,
  dedupeKey: string,
  clock: AwardClock,
  metadata: Record<string, unknown> = {},
): Promise<XPAwardResult | null> {
  const [level, streak] = await Promise.all([
    getUserLevel(db, userId),
    getUserStreak(db, userId),
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

  // Record the XP event FIRST — the unique index on (user_id, dedupe_key) is
  // the lock. Everything below only runs if this insert won the race, which
  // also closes the old lost-update window on current_xp.
  const { error: insertError } = await db.from('user_xp_events').insert({
    user_id: userId,
    board_id: boardId,
    action,
    xp_amount: xpAwarded,
    dedupe_key: dedupeKey,
    metadata: { ...metadata, streak_multiplier: streakMult },
  });

  if (insertError) {
    if (insertError.code === POSTGRES_UNIQUE_VIOLATION) return null;
    throw insertError;
  }

  // Update total XP and level
  const newTotalXP = level.current_xp + xpAwarded;
  const newLevel = levelFromXP(newTotalXP);
  const newTitle = titleForLevel(newLevel);
  const leveledUp = newLevel > previousLevel;

  await db.from('user_levels').update({
    current_xp: newTotalXP,
    current_level: newLevel,
    title: newTitle,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);

  // Update streak
  const streakResult = await updateStreak(db, userId, streak, clock);

  // Check badges
  const newBadges = await checkAndAwardBadges(db, userId, action, {
    totalXP: newTotalXP,
    level: newLevel,
    streak: streakResult.currentStreak,
    clock,
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

/** Award XP for completing a card, plus any on-time/early bonuses. */
export async function awardCardCompletionXP(
  db: SupabaseClient,
  userId: string,
  boardId: string,
  card: Card,
  clock: AwardClock,
  extraMetadata: Record<string, unknown> = {},
): Promise<XPAwardResult | null> {
  let action: XPAction = 'card_complete';
  if (card.priority === 'critical') action = 'card_complete_critical';
  else if (card.priority === 'high') action = 'card_complete_high';

  const result = await awardXP(db, userId, boardId, action, dedupeKeys.cardComplete(card.id), clock, {
    card_id: card.id,
    card_title: card.title,
    priority: card.priority,
    ...extraMetadata,
  });

  // Already completed once — don't re-run the bonuses either.
  if (!result) return null;

  // Check on-time/early bonuses
  if (card.due_date) {
    const due = new Date(card.due_date + 'T00:00:00Z');
    const today = new Date(clock.todayUtc + 'T00:00:00Z');
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0) {
      await awardXP(db, userId, boardId, 'card_on_time', dedupeKeys.cardOnTime(card.id), clock, { card_id: card.id });
    }
    if (diffDays > 1) {
      await awardXP(db, userId, boardId, 'card_early', dedupeKeys.cardEarly(card.id), clock, { card_id: card.id });
    }
  }

  return result;
}

// ─── Streak Management ──────────────────────────────────────

interface StreakUpdateResult {
  updated: boolean;
  currentStreak: number;
  freezeUsed: boolean;
  freezeTokensRemaining: number;
}

async function updateStreak(
  db: SupabaseClient,
  userId: string,
  streak: UserStreak,
  clock: AwardClock,
): Promise<StreakUpdateResult> {
  const today = clock.todayUtc;
  const lastActive = streak.last_active_date;

  // Already active today
  if (lastActive === today) {
    return { updated: false, currentStreak: streak.current_streak, freezeUsed: false, freezeTokensRemaining: streak.freeze_tokens };
  }

  const yesterdayStr = shiftDate(today, -1);

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

  await db.from('user_streaks').update({
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
  clock: AwardClock;
  metadata: Record<string, unknown>;
}

async function checkAndAwardBadges(
  db: SupabaseClient,
  userId: string,
  action: XPAction,
  ctx: BadgeCheckContext,
): Promise<string[]> {
  const existing = await getUserBadges(db, userId);
  const existingKeys = new Set(existing.map(b => b.badge_key));
  const newBadges: string[] = [];

  const tryAward = async (key: string) => {
    if (existingKeys.has(key)) return;
    await db.from('user_badges').insert({
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

    const today = ctx.clock.todayUtc;

    // Count all completions (shared query, reused below)
    const { count: totalCompletions } = await db
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
    const { count: todayCount } = await db
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
    const { count: critCount } = await db
      .from('user_xp_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'card_complete_critical');

    const crit = critCount || 0;
    if (crit >= 10) await tryAward('crisis_manager');
    if (crit >= 25) await tryAward('fire_suppressor');

    // High-or-critical completions
    const { count: highCount } = await db
      .from('user_xp_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('action', ['card_complete_high', 'card_complete_critical']);

    if ((highCount || 0) >= 50) await tryAward('high_achiever');

    // Time-of-day badges
    const { data: allCompletionTimes } = await db
      .from('user_xp_events')
      .select('created_at')
      .eq('user_id', userId)
      .in('action', ['card_complete', 'card_complete_high', 'card_complete_critical']);

    const nightCount = (allCompletionTimes || []).filter(e => {
      const h = localHour(e.created_at, ctx.clock.tzOffsetMinutes);
      return h >= 0 && h < 4;
    }).length;
    const morningCount = (allCompletionTimes || []).filter(e => {
      const h = localHour(e.created_at, ctx.clock.tzOffsetMinutes);
      return h >= 5 && h < 8;
    }).length;
    if (nightCount >= 10) await tryAward('night_owl');
    if (morningCount >= 10) await tryAward('early_bird');

    // Subtask thoroughness
    if (ctx.metadata.all_subtasks_complete === true) {
      await tryAward('thorough');

      const { count: thoroughCount } = await db
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
    const { count: earlyCount } = await db
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
    const { count: onTimeCount } = await db
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
    const { count: clearCount } = await db
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
    const { count: archiveCount } = await db
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
    const { count: createCount } = await db
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

    const { count: epicCount } = await db
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
    const { count: questTotal } = await db
      .from('daily_quests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true);

    const quests = questTotal || 0;
    if (quests >= 1) await tryAward('daily_duty');
    if (quests >= 30) await tryAward('devoted');
    if (quests >= 100) await tryAward('quest_master');

    const { count: todayQuestsDone } = await db
      .from('daily_quests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('date', ctx.clock.todayUtc)
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
