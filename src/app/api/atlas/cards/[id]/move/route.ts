import { type NextRequest } from 'next/server';
import {
  validateApiKey,
  getAdminClient,
  getBoardId,
  errorResponse,
} from '@/lib/atlas-api-auth';

type Params = Promise<{ id: string }>;

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

    // Stamp the completion time on entry into a done column, clear it on exit, so
    // only the newest conquered time is kept — matching useBoard.moveCardToColumn.
    const { data: targetCol } = await sb
      .from('columns')
      .select('is_done')
      .eq('id', resolvedColumnId)
      .single();
    const now = new Date().toISOString();

    const { error } = await sb
      .from('cards')
      .update({
        column_id: resolvedColumnId,
        column_changed_at: now,
        conquered_at: targetCol?.is_done ? now : null,
        updated_at: now,
      })
      .eq('id', id);

    if (error) return errorResponse(error.message, 500);

    const { data } = await sb.from('cards').select('*').eq('id', id).single();
    return Response.json({ card: data });
  } catch (err) {
    return errorResponse(String(err), 500);
  }
}
