import { type NextRequest } from 'next/server';
import {
  validateApiKey,
  getAdminClient,
  getBoardId,
  errorResponse,
} from '@/lib/atlas-api-auth';
import { computeNextDueDate } from '@/lib/recurrence';
import type { Card } from '@/types/database';

type Params = Promise<{ id: string }>;
type AdminClient = ReturnType<typeof getAdminClient>;

/**
 * Spawn the next occurrence of a recurring card when it lands in a done column,
 * mirroring useBoard.moveCardToColumn. Skips if an open (non-done) copy already
 * exists, so re-entering a done column can't double-spawn.
 */
async function spawnNextOccurrence(
  sb: AdminClient,
  boardId: string,
  card: Card,
  now: string,
): Promise<void> {
  if (!card.recurrence_rule) return;

  const { data: doneCols, error: doneErr } = await sb
    .from('columns')
    .select('id')
    .eq('board_id', boardId)
    .eq('is_done', true);
  if (doneErr) throw new Error(`Failed to load done columns: ${doneErr.message}`);
  const doneColumnIds = new Set((doneCols ?? []).map(c => c.id));

  const { data: existing, error: existingErr } = await sb
    .from('cards')
    .select('column_id')
    .eq('recurrence_source_id', card.id)
    .is('archived_at', null);
  if (existingErr) throw new Error(`Failed to check for spawned copies: ${existingErr.message}`);
  const alreadySpawned = (existing ?? []).some(c => !doneColumnIds.has(c.column_id));
  if (alreadySpawned) return;

  const { data: firstCol, error: firstColErr } = await sb
    .from('columns')
    .select('id')
    .eq('board_id', boardId)
    .eq('is_done', false)
    .order('position')
    .limit(1)
    .single();
  if (firstColErr || !firstCol) return;

  const { count } = await sb
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('column_id', firstCol.id)
    .is('archived_at', null);

  const nextDue = card.due_date ? computeNextDueDate(card.due_date, card.recurrence_rule) : null;

  const { error: insertErr } = await sb.from('cards').insert({
    board_id: boardId,
    column_id: firstCol.id,
    category_id: card.category_id,
    epic_id: card.epic_id,
    title: card.title,
    description: card.description,
    priority: card.priority,
    effort: card.effort,
    notes: card.notes,
    due_date: nextDue,
    estimated_hours: card.estimated_hours,
    actual_hours: null,
    position: count ?? 0,
    column_changed_at: now,
    conquered_at: null,
    recurrence_rule: card.recurrence_rule,
    recurrence_source_id: card.id,
  });
  if (insertErr) throw new Error(`Failed to spawn recurring card: ${insertErr.message}`);
}

/**
 * POST /api/atlas/cards/:id/move
 * Move a card to a different column.
 *
 * Body (one of):
 *   column_id   string   direct column UUID
 *   column      string   column title (case-insensitive, e.g. "Done")
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Params },
): Promise<Response> {
  if (!validateApiKey(request)) return errorResponse('Unauthorized', 401);

  try {
    const { id } = await params;
    const sb = getAdminClient();
    const boardId = await getBoardId();
    const body = (await request.json()) as Record<string, unknown>;
    const { column_id, column } = body as { column_id?: string; column?: string };

    let resolvedColumnId = column_id ?? null;
    if (!resolvedColumnId && column) {
      const { data } = await sb
        .from('columns')
        .select('id')
        .eq('board_id', boardId)
        .ilike('title', column)
        .limit(1)
        .single();
      resolvedColumnId = data?.id ?? null;
    }
    if (!resolvedColumnId) {
      return errorResponse('Provide column or column_id in request body', 400);
    }

    // Load the card before moving — needed for the activity log's from_column and
    // for the recurrence check.
    const { data: cardData, error: cardErr } = await sb
      .from('cards')
      .select('*')
      .eq('id', id)
      .single();
    if (cardErr || !cardData) return errorResponse('Card not found', 404);
    const card = cardData as Card;

    // Stamp the completion time on entry into a done column, clear it on exit, so
    // only the newest conquered time is kept — matching useBoard.moveCardToColumn.
    const { data: targetCol } = await sb
      .from('columns')
      .select('is_done')
      .eq('id', resolvedColumnId)
      .single();
    const now = new Date().toISOString();

    const { error: updateErr } = await sb
      .from('cards')
      .update({
        column_id: resolvedColumnId,
        column_changed_at: now,
        conquered_at: targetCol?.is_done ? now : null,
        updated_at: now,
      })
      .eq('id', id);
    if (updateErr) return errorResponse(updateErr.message, 500);

    // Activity log — mirror useBoard.moveCardToColumn. API calls have no
    // authenticated user, so attribute the entry to the board owner.
    const { data: boardRow, error: boardErr } = await sb
      .from('boards')
      .select('user_id')
      .eq('id', boardId)
      .single();
    if (boardErr || !boardRow) return errorResponse('Board owner not found', 500);
    const { error: logErr } = await sb.from('activity_log').insert({
      board_id: boardId,
      card_id: id,
      user_id: boardRow.user_id,
      action: 'card_moved',
      details: { from_column: card.column_id, to_column: resolvedColumnId },
    });
    if (logErr) return errorResponse(logErr.message, 500);

    // Recurring task: spawn the next occurrence when completing into a done column.
    if (card.recurrence_rule && targetCol?.is_done) {
      await spawnNextOccurrence(sb, boardId, card, now);
    }

    const { data } = await sb.from('cards').select('*').eq('id', id).single();
    return Response.json({ card: data });
  } catch (err) {
    return errorResponse(String(err), 500);
  }
}
