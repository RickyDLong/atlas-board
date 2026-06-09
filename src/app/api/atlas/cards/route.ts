import { type NextRequest } from 'next/server';
import {
  validateApiKey,
  getAdminClient,
  getBoardId,
  errorResponse,
} from '@/lib/atlas-api-auth';

/**
 * GET /api/atlas/cards
 * List cards. Optional query params:
 *   ?archived=true        — return archived cards instead of active
 *   ?column=In+Progress   — filter by column title (case-insensitive)
 *   ?epic=Atlas+Kanban    — filter by epic name (case-insensitive)
 */
export async function GET(request: NextRequest): Promise<Response> {
  if (!validateApiKey(request)) return errorResponse('Unauthorized', 401);

  try {
    const sb = getAdminClient();
    const boardId = await getBoardId();
    const { searchParams } = new URL(request.url);
    const archived = searchParams.get('archived') === 'true';
    const columnFilter = searchParams.get('column');
    const epicFilter = searchParams.get('epic');

    // Resolve optional column filter to an id
    let columnId: string | null = null;
    if (columnFilter) {
      const { data } = await sb
        .from('columns')
        .select('id')
        .eq('board_id', boardId)
        .ilike('title', columnFilter)
        .limit(1)
        .single();
      columnId = data?.id ?? null;
    }

    // Resolve optional epic filter to an id
    let epicId: string | null = null;
    if (epicFilter) {
      const { data } = await sb
        .from('epics')
        .select('id')
        .eq('board_id', boardId)
        .ilike('name', epicFilter)
        .limit(1)
        .single();
      epicId = data?.id ?? null;
    }

    let query = sb
      .from('cards')
      .select('*')
      .eq('board_id', boardId)
      .order('position');

    if (archived) {
      query = query.not('archived_at', 'is', null);
    } else {
      query = query.is('archived_at', null);
    }
    if (columnId) query = query.eq('column_id', columnId);
    if (epicId) query = query.eq('epic_id', epicId);

    const { data, error } = await query;
    if (error) return errorResponse(error.message, 500);
    return Response.json({ cards: data ?? [] });
  } catch (err) {
    return errorResponse(String(err), 500);
  }
}

/**
 * POST /api/atlas/cards
 * Create a new card.
 *
 * Body (all optional except title):
 *   title          string   required
 *   description    string
 *   column         string   column title (e.g. "In Progress") — resolved to id
 *   column_id      string   direct column UUID (takes precedence over column)
 *   epic           string   epic name — resolved to id
 *   epic_id        string   direct epic UUID
 *   category       string   category label — resolved to id
 *   category_id    string   direct category UUID
 *   priority       'critical' | 'high' | 'medium' | 'low'   default: 'medium'
 *   effort         'XS' | 'S' | 'M' | 'L' | 'XL'
 *   notes          string
 *   due_date       string   ISO date e.g. "2026-06-30"
 *   estimated_hours number
 */
export async function POST(request: NextRequest): Promise<Response> {
  if (!validateApiKey(request)) return errorResponse('Unauthorized', 401);

  try {
    const sb = getAdminClient();
    const boardId = await getBoardId();
    const body = (await request.json()) as Record<string, unknown>;

    const {
      title,
      description,
      column,
      column_id,
      epic,
      epic_id,
      category,
      category_id,
      priority = 'medium',
      effort,
      notes,
      due_date,
      estimated_hours,
    } = body as {
      title?: string;
      description?: string;
      column?: string;
      column_id?: string;
      epic?: string;
      epic_id?: string;
      category?: string;
      category_id?: string;
      priority?: string;
      effort?: string;
      notes?: string;
      due_date?: string;
      estimated_hours?: number;
    };

    if (!title?.trim()) return errorResponse('title is required', 400);

    // Resolve column — id > title > first non-done column
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
      const { data } = await sb
        .from('columns')
        .select('id')
        .eq('board_id', boardId)
        .eq('is_done', false)
        .order('position')
        .limit(1)
        .single();
      resolvedColumnId = data?.id ?? null;
    }
    if (!resolvedColumnId) return errorResponse('No column found', 400);

    // Resolve epic
    let resolvedEpicId = epic_id ?? null;
    if (!resolvedEpicId && epic) {
      const { data } = await sb
        .from('epics')
        .select('id')
        .eq('board_id', boardId)
        .ilike('name', epic)
        .limit(1)
        .single();
      resolvedEpicId = data?.id ?? null;
    }

    // Resolve category
    let resolvedCategoryId = category_id ?? null;
    if (!resolvedCategoryId && category) {
      const { data } = await sb
        .from('categories')
        .select('id')
        .eq('board_id', boardId)
        .ilike('label', category)
        .limit(1)
        .single();
      resolvedCategoryId = data?.id ?? null;
    }

    // Append to end of column
    const { count } = await sb
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('column_id', resolvedColumnId)
      .is('archived_at', null);

    const { data, error } = await sb
      .from('cards')
      .insert({
        board_id: boardId,
        column_id: resolvedColumnId,
        epic_id: resolvedEpicId,
        category_id: resolvedCategoryId,
        title: title.trim(),
        description: description ?? null,
        priority,
        effort: effort ?? null,
        notes: notes ?? null,
        due_date: due_date ?? null,
        estimated_hours: estimated_hours ?? null,
        position: count ?? 0,
      })
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return Response.json({ card: data }, { status: 201 });
  } catch (err) {
    return errorResponse(String(err), 500);
  }
}
