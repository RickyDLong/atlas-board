import { type NextRequest } from 'next/server';
import {
  validateApiKey,
  getAdminClient,
  getBoardId,
  errorResponse,
} from '@/lib/atlas-api-auth';

/**
 * GET /api/atlas/board
 * Returns the full board state: columns, active cards, epics, and categories.
 */
export async function GET(request: NextRequest): Promise<Response> {
  if (!validateApiKey(request)) return errorResponse('Unauthorized', 401);

  try {
    const sb = getAdminClient();
    const boardId = await getBoardId();

    const [columns, cards, epics, categories, cardRelationships, cardFlags] = await Promise.all([
      sb.from('columns').select('*').eq('board_id', boardId).order('position'),
      sb.from('cards').select('*').eq('board_id', boardId).is('archived_at', null).order('position'),
      sb.from('epics').select('*').eq('board_id', boardId).order('created_at'),
      sb.from('categories').select('*').eq('board_id', boardId).order('position'),
      sb.from('card_relationships').select('*').eq('board_id', boardId),
      sb.from('card_flags').select('*').eq('board_id', boardId),
    ]);

    return Response.json({
      board_id: boardId,
      columns: columns.data ?? [],
      cards: cards.data ?? [],
      epics: epics.data ?? [],
      categories: categories.data ?? [],
      card_relationships: cardRelationships.data ?? [],
      card_flags: cardFlags.data ?? [],
    });
  } catch (err) {
    return errorResponse(String(err), 500);
  }
}
