import { createClient } from '@/lib/supabase/server';
import { getAdminClient, errorResponse } from '@/lib/atlas-api-auth';
import { awardXP, awardCardCompletionXP, awardClock, dedupeKeys } from '@/lib/gamification-award';
import type { AwardClock } from '@/lib/gamification-award';
import type { Card, XPAwardResult } from '@/types/database';

/**
 * The only path that can grant XP. Migration 028 revoked client write access to
 * the gamification tables, so awards run here with the service-role key.
 *
 * Nothing about the award is taken on trust from the request body: the card is
 * re-read from the database and its column is checked for is_done, so a crafted
 * request cannot claim a completion that did not happen. Replays are absorbed by
 * the dedupe keys, which are backed by a unique index.
 */

type AwardKind = 'card_complete' | 'epic_complete' | 'card_create' | 'archive_batch';

interface AwardRequest {
  boardId?: unknown;
  kind?: unknown;
  cardId?: unknown;
  epicId?: unknown;
  tzOffsetMinutes?: unknown;
}

const AWARD_KINDS: AwardKind[] = ['card_complete', 'epic_complete', 'card_create', 'archive_batch'];

export async function POST(request: Request) {
  let body: AwardRequest;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { boardId, kind, cardId, epicId, tzOffsetMinutes } = body;

  if (typeof boardId !== 'string') return errorResponse('boardId is required', 400);
  if (typeof kind !== 'string' || !AWARD_KINDS.includes(kind as AwardKind)) {
    return errorResponse('Unknown award kind', 400);
  }
  if (typeof tzOffsetMinutes !== 'number' || !Number.isFinite(tzOffsetMinutes) || Math.abs(tzOffsetMinutes) > 900) {
    return errorResponse('tzOffsetMinutes must be a plausible timezone offset', 400);
  }

  const clock: AwardClock = awardClock(tzOffsetMinutes);

  // Identify the caller from their session cookie.
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return errorResponse('Not authenticated', 401);

  let db: ReturnType<typeof getAdminClient>;
  try {
    db = getAdminClient();
  } catch (err) {
    // Fail loudly: without the service role key XP silently stops working.
    console.error('[gamification/award] admin client unavailable:', err);
    return errorResponse('Gamification is not configured', 500);
  }

  // The caller must own the board they are claiming XP on.
  const { data: board } = await db
    .from('boards')
    .select('id')
    .eq('id', boardId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!board) return errorResponse('Board not found', 404);

  try {
    const result = await runAward(db, user.id, boardId, kind as AwardKind, { cardId, epicId }, clock);
    // A null result means the award was already granted — not an error.
    return Response.json({ result });
  } catch (err) {
    console.error('[gamification/award] award failed:', err);
    return errorResponse('Award failed', 500);
  }
}

async function runAward(
  db: ReturnType<typeof getAdminClient>,
  userId: string,
  boardId: string,
  kind: AwardKind,
  ids: { cardId?: unknown; epicId?: unknown },
  clock: AwardClock,
): Promise<XPAwardResult | null> {
  if (kind === 'card_create') {
    return awardXP(db, userId, boardId, 'card_create', dedupeKeys.cardCreate(clock.todayUtc), clock);
  }

  if (kind === 'archive_batch') {
    return awardXP(db, userId, boardId, 'archive_batch', dedupeKeys.archiveBatch(clock.todayUtc), clock);
  }

  if (kind === 'epic_complete') {
    if (typeof ids.epicId !== 'string') throw new Error('epicId is required for epic_complete');
    return awardEpicCompletion(db, userId, boardId, ids.epicId, clock);
  }

  if (typeof ids.cardId !== 'string') throw new Error('cardId is required for card_complete');
  return awardCardCompletion(db, userId, boardId, ids.cardId, clock);
}

/** True when the card's current column is flagged is_done. Read from the DB, never the request. */
async function isCardInDoneColumn(
  db: ReturnType<typeof getAdminClient>,
  card: Card,
): Promise<boolean> {
  const { data: column } = await db
    .from('columns')
    .select('is_done')
    .eq('id', card.column_id)
    .maybeSingle();
  return column?.is_done === true;
}

async function awardCardCompletion(
  db: ReturnType<typeof getAdminClient>,
  userId: string,
  boardId: string,
  cardId: string,
  clock: AwardClock,
): Promise<XPAwardResult | null> {
  const { data: card } = await db
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .eq('board_id', boardId)
    .maybeSingle();
  if (!card) return null;

  if (!(await isCardInDoneColumn(db, card as Card))) return null;

  const { data: subtasks } = await db
    .from('subtasks')
    .select('completed')
    .eq('card_id', cardId);

  const list = subtasks ?? [];
  const allSubtasksDone = list.length > 0 && list.every(s => s.completed);

  return awardCardCompletionXP(db, userId, boardId, card as Card, clock, {
    all_subtasks_complete: allSubtasksDone,
    subtask_count: list.length,
  });
}

async function awardEpicCompletion(
  db: ReturnType<typeof getAdminClient>,
  userId: string,
  boardId: string,
  epicId: string,
  clock: AwardClock,
): Promise<XPAwardResult | null> {
  const { data: epic } = await db
    .from('epics')
    .select('id, name')
    .eq('id', epicId)
    .eq('board_id', boardId)
    .maybeSingle();
  if (!epic) return null;

  const { data: doneColumns } = await db
    .from('columns')
    .select('id')
    .eq('board_id', boardId)
    .eq('is_done', true);

  const doneIds = new Set((doneColumns ?? []).map(c => c.id));
  if (doneIds.size === 0) return null;

  const { data: epicCards } = await db
    .from('cards')
    .select('column_id')
    .eq('epic_id', epicId)
    .is('archived_at', null);

  const cards = epicCards ?? [];
  const allDone = cards.length > 0 && cards.every(c => doneIds.has(c.column_id));
  if (!allDone) return null;

  return awardXP(db, userId, boardId, 'epic_complete', dedupeKeys.epicComplete(epicId), clock, {
    epic_id: epicId,
    epic_name: epic.name,
  });
}
