import { type NextRequest } from 'next/server';
import {
  validateApiKey,
  getAdminClient,
  errorResponse,
} from '@/lib/atlas-api-auth';

type Params = Promise<{ id: string }>;

/**
 * POST /api/atlas/cards/:id/archive
 * Archive (or unarchive) a card.
 *
 * Body:
 *   unarchive   boolean   pass true to restore an archived card (default: false)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Params },
): Promise<Response> {
  if (!validateApiKey(request)) return errorResponse('Unauthorized', 401);

  try {
    const { id } = await params;
    const sb = getAdminClient();
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const unarchive = body.unarchive === true;

    const { error } = await sb
      .from('cards')
      .update({
        archived_at: unarchive ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return errorResponse(error.message, 500);

    const { data } = await sb.from('cards').select('*').eq('id', id).single();
    return Response.json({ card: data });
  } catch (err) {
    return errorResponse(String(err), 500);
  }
}
