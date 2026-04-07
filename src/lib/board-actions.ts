import { createClient } from '@/lib/supabase/client';
import type { Board, Column, Category, Card, Epic } from '@/types/database';
import { DEFAULT_COLUMNS, DEFAULT_CATEGORIES } from '@/types/database';

const supabase = createClient();

// ─── Board ───────────────────────────────────────────────────

export async function getOrCreateBoard(): Promise<Board> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1);

  if (boards && boards.length > 0) return boards[0] as Board;

  const { data: board, error } = await supabase
    .from('boards')
    .insert({ user_id: user.id, name: 'My Board' })
    .select()
    .single();

  if (error) throw error;

  const colInserts = DEFAULT_COLUMNS.map((col, i) => ({
    board_id: board.id, title: col.title, color: col.color, position: i,
  }));
  await supabase.from('columns').insert(colInserts);

  const catInserts = DEFAULT_CATEGORIES.map((cat, i) => ({
    board_id: board.id, label: cat.label, color: cat.color, position: i,
  }));
  await supabase.from('categories').insert(catInserts);

  return board as Board;
}

// ─── Columns ─────────────────────────────────────────────────

export async function getColumns(boardId: string): Promise<Column[]> {
  const { data, error } = await supabase.from('columns').select('*').eq('board_id', boardId).order('position');
  if (error) throw error;
  return data as Column[];
}

export async function createColumn(boardId: string, title: string, color: string, position: number): Promise<Column> {
  const { data, error } = await supabase.from('columns').insert({ board_id: boardId, title, color, position }).select().single();
  if (error) throw error;
  return data as Column;
}

export async function updateColumn(id: string, updates: Partial<Pick<Column, 'title' | 'color' | 'position'>>): Promise<void> {
  const { error } = await supabase.from('columns').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteColumn(id: string): Promise<void> {
  const { error } = await supabase.from('columns').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderColumns(cols: { id: string; position: number }[]): Promise<void> {
  for (const col of cols) {
    await supabase.from('columns').update({ position: col.position }).eq('id', col.id);
  }
}

// ─── Categories ──────────────────────────────────────────────

export async function getCategories(boardId: string): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').eq('board_id', boardId).order('position');
  if (error) throw error;
  return data as Category[];
}

export async function createCategory(boardId: string, label: string, color: string, position: number): Promise<Category> {
  const { data, error } = await supabase.from('categories').insert({ board_id: boardId, label, color, position }).select().single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(id: string, updates: Partial<Pick<Category, 'label' | 'color' | 'position'>>): Promise<void> {
  const { error } = await supabase.from('categories').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ─── Epics ───────────────────────────────────────────────────

export async function getEpics(boardId: string): Promise<Epic[]> {
  const { data, error } = await supabase.from('epics').select('*').eq('board_id', boardId).order('created_at');
  if (error) throw error;
  return data as Epic[];
}

export async function createEpic(epic: Omit<Epic, 'id' | 'created_at' | 'updated_at'>): Promise<Epic> {
  const { data, error } = await supabase.from('epics').insert(epic).select().single();
  if (error) throw error;
  return data as Epic;
}

export async function updateEpic(id: string, updates: Partial<Omit<Epic, 'id' | 'board_id' | 'created_at'>>): Promise<void> {
  const { error } = await supabase.from('epics').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function deleteEpic(id: string): Promise<void> {
  // Unlink cards first, then delete
  await supabase.from('cards').update({ epic_id: null }).eq('epic_id', id);
  const { error } = await supabase.from('epics').delete().eq('id', id);
  if (error) throw error;
}

// ─── Cards ───────────────────────────────────────────────────

export async function getCards(boardId: string): Promise<Card[]> {
  const { data, error } = await supabase.from('cards').select('*').eq('board_id', boardId).is('archived_at', null).order('position');
  if (error) throw error;
  return data as Card[];
}

export async function getArchivedCards(boardId: string): Promise<Card[]> {
  const { data, error } = await supabase.from('cards').select('*').eq('board_id', boardId).not('archived_at', 'is', null).order('archived_at', { ascending: false });
  if (error) throw error;
  return data as Card[];
}

export async function archiveCard(id: string): Promise<void> {
  const { error } = await supabase.from('cards').update({ archived_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function unarchiveCard(id: string): Promise<void> {
  const { error } = await supabase.from('cards').update({ archived_at: null }).eq('id', id);
  if (error) throw error;
}

export async function archiveEpicCards(epicId: string): Promise<string[]> {
  // Archive all cards belonging to this epic, return their IDs
  const { data, error } = await supabase.from('cards').update({ archived_at: new Date().toISOString() }).eq('epic_id', epicId).select('id');
  if (error) throw error;
  return (data || []).map((c: { id: string }) => c.id);
}

export async function createCard(card: Omit<Card, 'id' | 'created_at' | 'updated_at'>): Promise<Card> {
  const { data, error } = await supabase.from('cards').insert(card).select().single();
  if (error) throw error;
  return data as Card;
}

export async function updateCard(id: string, updates: Partial<Omit<Card, 'id' | 'board_id' | 'created_at'>>): Promise<void> {
  const { error } = await supabase.from('cards').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function deleteCard(id: string): Promise<void> {
  const { error } = await supabase.from('cards').delete().eq('id', id);
  if (error) throw error;
}

export async function moveCard(id: string, columnId: string): Promise<void> {
  await updateCard(id, { column_id: columnId, column_changed_at: new Date().toISOString() });
}

// ─── Auth ────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
