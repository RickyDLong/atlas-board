import { type NextRequest } from 'next/server';
import {
  validateApiKey,
  getAdminClient,
  getBoardId,
  errorResponse,
} from '@/lib/atlas-api-auth';

/**
 * GET /api/atlas/categories
 * Returns all categories ordered by position.
 */
export async function GET(request: NextRequest): Promise<Response> {
  if (!validateApiKey(request)) return errorResponse('Unauthorized', 401);

  try {
    const sb = getAdminClient();
    const boardId = await getBoardId();
    const { data, error } = await sb
      .from('categories')
      .select('*')
      .eq('board_id', boardId)
      .order('position');
    if (error) return errorResponse(error.message, 500);
    return Response.json({ categories: data ?? [] });
  } catch (err) {
    return errorResponse(String(err), 500);
  }
}
