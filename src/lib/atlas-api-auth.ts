import { createClient } from '@supabase/supabase-js';

/**
 * Validates the Bearer token on incoming Atlas API requests.
 * Callers must set ATLAS_INTERNAL_API_KEY in Vercel environment variables.
 */
export function validateApiKey(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const key = authHeader.slice(7);
  const expected = process.env.ATLAS_INTERNAL_API_KEY;
  if (!expected) return false;
  return key === expected;
}

/**
 * Creates a Supabase admin client that bypasses RLS using the service role key.
 * Requires SUPABASE_SERVICE_ROLE_KEY in environment variables.
 */
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables',
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Returns the board_id for this Atlas instance.
 * Checks ATLAS_BOARD_ID env var first; falls back to the first board in the DB
 * (safe for a single-user deployment).
 */
export async function getBoardId(): Promise<string> {
  const pinned = process.env.ATLAS_BOARD_ID;
  if (pinned) return pinned;

  const sb = getAdminClient();
  const { data, error } = await sb
    .from('boards')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(`Board not found: ${error?.message ?? 'empty result'}`);
  }
  return data.id;
}

/** Shorthand for structured JSON error responses. */
export function errorResponse(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}
