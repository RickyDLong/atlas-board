import { type NextRequest } from 'next/server';
import {
  validateApiKey,
  getAdminClient,
  getBoardId,
  errorResponse,
} from '@/lib/atlas-api-auth';

/**
 * GET /api/atlas/epics
 * Returns all epics ordered by created_at.
 */
export async function GET(request: NextRequest): Promise<Response> {
  if (!validateApiKey(request)) return errorResponse('Unauthorized', 401);

  try {
    const sb = getAdminClient();
    const boardId = await getBoardId();
    const { data, error } = await sb
      .from('epics')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at');
    if (error) return errorResponse(error.message, 500);
    return Response.json({ epics: data ?? [] });
  } catch (err) {
    return errorResponse(String(err), 500);
  }
}

/**
 * POST /api/atlas/epics
 * Create a new epic.
 *
 * Body:
 *   name           string   required
 *   description    string
 *   color          string   hex e.g. '#4a9eff'  default: '#4a9eff'
 *   status         'planning' | 'active' | 'completed' | 'archived'  default: 'planning'
 *   target_date    string   ISO date e.g. '2026-12-31'
 */
export async function POST(request: NextRequest): Promise<Response> {
  if (!validateApiKey(request)) return errorResponse('Unauthorized', 401);

  try {
    const sb = getAdminClient();
    const boardId = await getBoardId();
    const body = (await request.json()) as Record<string, unknown>;
    const {
      name,
      description,
      color = '#4a9eff',
      status = 'planning',
      target_date,
    } = body as {
      name?: string;
      description?: string;
      color?: string;
      status?: string;
      target_date?: string;
    };

    if (!name?.trim()) return errorResponse('name is required', 400);

    const { data, error } = await sb
      .from('epics')
      .insert({
        board_id: boardId,
        name: name.trim(),
        description: description ?? null,
        color,
        status,
        target_date: target_date ?? null,
      })
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return Response.json({ epic: data }, { status: 201 });
  } catch (err) {
    return errorResponse(String(err), 500);
  }
}
