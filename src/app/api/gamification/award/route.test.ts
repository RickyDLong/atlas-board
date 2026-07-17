import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { XPAwardResult } from '@/types/database';

/**
 * Tests for the server-authority layer of /api/gamification/award.
 *
 * The award engine itself (dedupe, streaks, badges) is covered in
 * gamification-award.test.ts. Here we exercise only what the route is
 * responsible for: authentication, board ownership, and the DB-backed checks
 * that decide whether an award is owed at all. The engine functions are mocked
 * so a test asserts on whether the route decided to call them.
 */

const getUser = vi.fn();
const awardCardCompletionXP = vi.fn();
const awardXP = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

vi.mock('@/lib/atlas-api-auth', async (importActual) => ({
  ...(await importActual<typeof import('@/lib/atlas-api-auth')>()),
  getAdminClient: () => adminDb,
}));

vi.mock('@/lib/gamification-award', async (importActual) => ({
  ...(await importActual<typeof import('@/lib/gamification-award')>()),
  awardCardCompletionXP: (...args: unknown[]) => awardCardCompletionXP(...args),
  awardXP: (...args: unknown[]) => awardXP(...args),
}));

import { POST } from './route';

const USER = { id: 'user-1' };
const BOARD_ID = 'board-1';

/**
 * A minimal Supabase stub. Single-row reads (maybeSingle/single) and list reads
 * (awaited directly) are seeded separately per table, which is enough to
 * distinguish the route's two uses of `cards` and `columns`.
 */
type TableSeed = { single?: unknown; list?: unknown[] };
let seed: Record<string, TableSeed>;

const adminDb = {
  from(table: string) {
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      is: () => chain,
      maybeSingle: () => Promise.resolve({ data: seed[table]?.single ?? null, error: null }),
      single: () => Promise.resolve({ data: seed[table]?.single ?? null, error: null }),
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: seed[table]?.list ?? [], error: null }).then(resolve),
    };
    return chain;
  },
};

function post(body: unknown): Request {
  return new Request('http://test/api/gamification/award', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const AWARD_RESULT = { xpAwarded: 25, action: 'card_complete' } as unknown as XPAwardResult;

const validBody = { boardId: BOARD_ID, kind: 'card_complete', cardId: 'card-1', tzOffsetMinutes: 0 };

describe('POST /api/gamification/award', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seed = {};
    getUser.mockResolvedValue({ data: { user: USER } });
    // Default: user owns the board.
    seed.boards = { single: { id: BOARD_ID } };
  });

  it('rejects an unknown award kind before doing any work', async () => {
    const res = await POST(post({ ...validBody, kind: 'mint_infinite_xp' }));
    expect(res.status).toBe(400);
    expect(getUser).not.toHaveBeenCalled();
  });

  it('rejects an implausible timezone offset', async () => {
    const res = await POST(post({ ...validBody, tzOffsetMinutes: 5000 }));
    expect(res.status).toBe(400);
  });

  it('rejects an unauthenticated caller', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(post(validBody));
    expect(res.status).toBe(401);
    expect(awardCardCompletionXP).not.toHaveBeenCalled();
  });

  it('rejects a board the caller does not own', async () => {
    seed.boards = { single: null }; // ownership query returns nothing
    const res = await POST(post(validBody));
    expect(res.status).toBe(404);
    expect(awardCardCompletionXP).not.toHaveBeenCalled();
  });

  it('refuses to award a card whose current column is not is_done', async () => {
    seed.cards = { single: { id: 'card-1', column_id: 'col-doing' } };
    seed.columns = { single: { is_done: false } };

    const res = await POST(post(validBody));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ result: null });
    expect(awardCardCompletionXP).not.toHaveBeenCalled();
  });

  it('awards completion for a card confirmed in a done column', async () => {
    seed.cards = { single: { id: 'card-1', column_id: 'col-done' } };
    seed.columns = { single: { is_done: true } };
    seed.subtasks = { list: [] };
    awardCardCompletionXP.mockResolvedValue(AWARD_RESULT);

    const res = await POST(post(validBody));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ result: AWARD_RESULT });
    expect(awardCardCompletionXP).toHaveBeenCalledTimes(1);
  });

  it('returns null for a card the server cannot find, without awarding', async () => {
    seed.cards = { single: null };
    const res = await POST(post(validBody));
    await expect(res.json()).resolves.toEqual({ result: null });
    expect(awardCardCompletionXP).not.toHaveBeenCalled();
  });

  it('withholds the epic bonus until every non-archived card is in a done column', async () => {
    seed.epics = { single: { id: 'epic-1', name: 'Launch' } };
    seed.columns = { list: [{ id: 'col-done' }] };
    seed.cards = { list: [{ column_id: 'col-done' }, { column_id: 'col-doing' }] };

    const res = await POST(post({ boardId: BOARD_ID, kind: 'epic_complete', epicId: 'epic-1', tzOffsetMinutes: 0 }));

    await expect(res.json()).resolves.toEqual({ result: null });
    expect(awardXP).not.toHaveBeenCalled();
  });

  it('awards the epic bonus once every card is done', async () => {
    seed.epics = { single: { id: 'epic-1', name: 'Launch' } };
    seed.columns = { list: [{ id: 'col-done' }] };
    seed.cards = { list: [{ column_id: 'col-done' }, { column_id: 'col-done' }] };
    awardXP.mockResolvedValue({ xpAwarded: 200 } as unknown as XPAwardResult);

    const res = await POST(post({ boardId: BOARD_ID, kind: 'epic_complete', epicId: 'epic-1', tzOffsetMinutes: 0 }));

    await expect(res.json()).resolves.toMatchObject({ result: { xpAwarded: 200 } });
    expect(awardXP).toHaveBeenCalledTimes(1);
    const [, , , action, dedupeKey] = awardXP.mock.calls[0];
    expect(action).toEqual('epic_complete');
    expect(dedupeKey).toEqual('epic_complete:epic-1');
  });
});
