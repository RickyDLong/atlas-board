import { type NextRequest } from 'next/server';
import {
  validateApiKey,
  getAdminClient,
  errorResponse,
} from '@/lib/atlas-api-auth';

type Params = Promise<{ id: string }>;

/**
 * PATCH /api/atlas/epics/:id
 * Update an epic. Only provided fields are changed.
 *
 * Allowed fields: name, description, color, status, target_date
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

    const ALLOWED = ['name', 'description', 'color', 'status', 'target_date'] as const;
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    for (const key of ALLOWED) {
      if (key in body) updates[key] = body[key];
    }

    const { error } = await sb.from('epics').update(updates).eq('id', id);
    if (error) return errorResponse(error.message, 500);

    const { data } = await sb.from('epics').select('*').eq('id', id).single();
    return Response.json({ epic: data });
  } catch (err) {
    return errorResponse(String(err), 500);
  }
}

/**
 * DELETE /api/atlas/epics/:id
 * Deletes an epic and unlinks all its cards (sets epic_id to null).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params },
): Promise<Response> {
  if (!validateApiKey(request)) return errorResponse('Unauthorized', 401);

  try {
    const { id } = await params;
    const sb = getAdminClient();

    // Unlink cards before deleting
    await sb.from('cards').update({ epic_id: null }).eq('epic_id', id);

    const { error } = await sb.from('epics').delete().eq('id', id);
    if (error) return errorResponse(error.message, 500);
    return Response.json({ success: true });
  } catch (err) {
    return errorResponse(String(err), 500);
  }
}
