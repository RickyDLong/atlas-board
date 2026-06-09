import { type NextRequest } from 'next/server';
import {
  validateApiKey,
  getAdminClient,
  errorResponse,
} from '@/lib/atlas-api-auth';

type Params = Promise<{ id: string }>;

/**
 * GET /api/atlas/cards/:id
 * Fetch a single card by UUID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Params },
): Promise<Response> {
  if (!validateApiKey(request)) return errorResponse('Unauthorized', 401);

  try {
    const { id } = await params;
    const sb = getAdminClient();
    const { data, error } = await sb.from('cards').select('*').eq('id', id).single();
    if (error || !data) return errorResponse('Card not found', 404);
    return Response.json({ card: data });
  } catch (err) {
    return errorResponse(String(err), 500);
  }
}

/**
 * PATCH /api/atlas/cards/:id
 * Update card fields. Only the fields provided are changed.
 *
 * Allowed fields:
 *   title, description, priority, effort, notes, due_date,
 *   epic_id, category_id, estimated_hours, actual_hours
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params },
): Promise<Response> {
  if (!validateApiKey(request)) return errorResponse('Unauthorized', 401);

  try {
    const { id } = await params;
    const sb = getAdminClient();
    const body = (await request.json()) as Record<string, unknown>;

    const ALLOWED = [
      'title',
      'description',
      'priority',
      'effort',
      'notes',
      'due_date',
      'epic_id',
      'category_id',
      'estimated_hours',
      'actual_hours',
    ] as const;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    for (const key of ALLOWED) {
      if (key in body) updates[key] = body[key];
    }

    const { error } = await sb.from('cards').update(updates).eq('id', id);
    if (error) return errorResponse(error.message, 500);

    const { data } = await sb.from('cards').select('*').eq('id', id).single();
    return Response.json({ card: data });
  } catch (err) {
    return errorResponse(String(err), 500);
  }
}

/**
 * DELETE /api/atlas/cards/:id
 * Permanently delete a card.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params },
): Promise<Response> {
  if (!validateApiKey(request)) return errorResponse('Unauthorized', 401);

  try {
    const { id } = await params;
    const sb = getAdminClient();
    const { error } = await sb.from('cards').delete().eq('id', id);
    if (error) return errorResponse(error.message, 500);
    return Response.json({ success: true });
  } catch (err) {
    return errorResponse(String(err), 500);
  }
}
