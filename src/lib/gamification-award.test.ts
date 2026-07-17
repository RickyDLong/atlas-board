import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { awardXP, awardClock, dedupeKeys } from './gamification-award';

const USER_ID = 'user-1';
const BOARD_ID = 'board-1';
const CARD_ID = 'card-1';
const CLOCK = { todayUtc: '2026-07-17', tzOffsetMinutes: 0 };

const UNIQUE_VIOLATION = { code: '23505', message: 'duplicate key value violates unique constraint' };

/**
 * A Supabase stub covering only what the award engine touches. The engine takes
 * its client as an argument, so no module mocking is needed.
 *
 * `insertError` drives what user_xp_events.insert returns, which is the branch
 * under test.
 */
function fakeDb({ insertError = null }: { insertError?: { code: string; message: string } | null } = {}) {
  const inserts: Record<string, unknown[]> = {};
  const updates: Record<string, unknown[]> = {};

  const level = { user_id: USER_ID, current_xp: 0, current_level: 1, title: 'Wanderer', updated_at: '' };
  const streak = { user_id: USER_ID, current_streak: 0, longest_streak: 0, last_active_date: null, freeze_tokens: 0, updated_at: '' };

  const rowFor = (table: string) => {
    if (table === 'user_levels') return level;
    if (table === 'user_streaks') return streak;
    return null;
  };

  const db = {
    from(table: string) {
      const builder: Record<string, unknown> = {
        insert(payload: unknown) {
          (inserts[table] ||= []).push(payload);
          if (table === 'user_xp_events') return Promise.resolve({ data: null, error: insertError });
          const chain = {
            select: () => chain,
            single: () => Promise.resolve({ data: rowFor(table), error: null }),
          };
          return Object.assign(Promise.resolve({ data: null, error: null }), chain);
        },
        update(payload: unknown) {
          (updates[table] ||= []).push(payload);
          return { eq: () => Promise.resolve({ data: null, error: null }) };
        },
        select() {
          const chain: Record<string, unknown> = {
            eq: () => chain,
            in: () => chain,
            gte: () => chain,
            lte: () => chain,
            filter: () => chain,
            order: () => Promise.resolve({ data: [], error: null, count: 0 }),
            single: () => Promise.resolve({ data: rowFor(table), error: null }),
            maybeSingle: () => Promise.resolve({ data: rowFor(table), error: null }),
            then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve),
          };
          return chain;
        },
      };
      return builder;
    },
  };

  return { db: db as unknown as SupabaseClient, inserts, updates };
}

describe('dedupeKeys', () => {
  it('keys card completion on the card id, not the priority-specific action', () => {
    expect(dedupeKeys.cardComplete(CARD_ID)).toEqual('card_complete:card-1');
  });

  it('keys the daily-capped awards on the date so a recreated entity cannot re-pay', () => {
    expect(dedupeKeys.cardCreate('2026-07-17')).toEqual('card_create:2026-07-17');
    expect(dedupeKeys.archiveBatch('2026-07-17')).toEqual('archive_batch:2026-07-17');
  });

  it('gives each bonus its own key so they do not collide with the completion', () => {
    const keys = [
      dedupeKeys.cardComplete(CARD_ID),
      dedupeKeys.cardOnTime(CARD_ID),
      dedupeKeys.cardEarly(CARD_ID),
      dedupeKeys.epicComplete(CARD_ID),
    ];
    expect(new Set(keys).size).toEqual(keys.length);
  });
});

describe('awardClock', () => {
  it('derives the date itself rather than accepting one from the caller', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-17T12:00:00Z'));
    expect(awardClock(300)).toEqual({ todayUtc: '2026-07-17', tzOffsetMinutes: 300 });
    vi.useRealTimers();
  });
});

describe('awardXP', () => {
  it('records the event with its dedupe key and returns the award', async () => {
    const { db, inserts } = fakeDb();

    const result = await awardXP(db, USER_ID, BOARD_ID, 'card_complete', dedupeKeys.cardComplete(CARD_ID), CLOCK);

    expect(result?.xpAwarded).toEqual(25);
    expect(inserts.user_xp_events).toEqual([
      expect.objectContaining({ user_id: USER_ID, action: 'card_complete', dedupe_key: 'card_complete:card-1' }),
    ]);
  });

  it('returns null and writes no XP when the award was already granted', async () => {
    const { db, updates } = fakeDb({ insertError: UNIQUE_VIOLATION });

    const result = await awardXP(db, USER_ID, BOARD_ID, 'card_complete', dedupeKeys.cardComplete(CARD_ID), CLOCK);

    expect(result).toBeNull();
    expect(updates.user_levels).toBeUndefined();
    expect(updates.user_streaks).toBeUndefined();
  });

  it('propagates insert failures that are not a duplicate award', async () => {
    const { db } = fakeDb({ insertError: { code: '23503', message: 'foreign key violation' } });

    await expect(
      awardXP(db, USER_ID, BOARD_ID, 'card_complete', dedupeKeys.cardComplete(CARD_ID), CLOCK),
    ).rejects.toMatchObject({ code: '23503' });
  });
});
