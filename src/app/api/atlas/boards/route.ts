import { type NextRequest } from 'next/server';
import {
  validateApiKey,
  getAdminClient,
  errorResponse,
} from '@/lib/atlas-api-auth';

/**
 * GET /api/atlas/boards
 * Lists every board with its active card count, oldest first.
 *
 * Exists so a caller can identify which board_id to pin via ATLAS_BOARD_ID.
 * getBoardId() silently falls back to the oldest board when that variable is
 * unset, and boards share the default name 'My Board', so the card count is
 * what actually distinguishes them. `pinned` reports the currently configured
 * ATLAS_BOARD_ID, or null when the fallback is in effect.
 */
export async function GET(request: NextRequest): Promise<Response> {
  if (!validateApiKey(request)) return errorResponse('Unauthorized', 401);

  try {
    const sb = getAdminClient();
    const { data: boards, error } = await sb
      .from('boards')
      .select('id, name, created_at')
      .order('created_at');

    if (error) return errorResponse(error.message, 500);

    const withCounts = await Promise.all(
      (boards ?? []).map(async (board) => {
        const { count } = await sb
          .from('cards')
          .select('*', { count: 'exact', head: true })
          .eq('board_id', board.id)
          .is('archived_at', null);
        return { ...board, active_cards: count ?? 0 };
      }),
    );

    return Response.json({
      boards: withCounts,
      pinned: process.env.ATLAS_BOARD_ID ?? null,
    });
  } catch (err) {
    return errorResponse(String(err), 500);
  }
}
