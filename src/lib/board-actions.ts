import { createClient } from '@/lib/supabase/client';
import type { Board, Column, Category, Card, Epic, Subtask, UserPreferences, ColumnTransition, CfdSnapshot, SavedFilter, Label, CardLabel, CardTemplate, ActivityLogEntry, ActivityAction, CardComment, CardRelationship, RelationshipType, CardAttachment } from '@/types/database';
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
    board_id: board.id, title: col.title, color: col.color, position: i, is_done: col.is_done, wip_limit: col.wip_limit,
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

export async function createColumn(boardId: string, title: string, color: string, position: number, is_done: boolean = false, wip_limit: number | null = null): Promise<Column> {
  const { data, error } = await supabase.from('columns').insert({ board_id: boardId, title, color, position, is_done, wip_limit }).select().single();
  if (error) throw error;
  return data as Column;
}

export async function updateColumn(id: string, updates: Partial<Pick<Column, 'title' | 'color' | 'position' | 'is_done' | 'wip_limit'>>): Promise<void> {
  const { error } = await supabase.from('columns').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteColumn(id: string): Promise<void> {
  const { error } = await supabase.from('columns').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderColumns(cols: { id: string; position: number }[]): Promise<void> {
  await Promise.all(
    cols.map(col => supabase.from('columns').update({ position: col.position }).eq('id', col.id))
  );
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

// ─── Subtasks ────────────────────────────────────────────────

export async function getSubtasks(cardId: string): Promise<Subtask[]> {
  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('card_id', cardId)
    .order('position');
  if (error) throw error;
  return data as Subtask[];
}

export async function createSubtask(cardId: string, title: string, position: number): Promise<Subtask> {
  const { data, error } = await supabase
    .from('subtasks')
    .insert({ card_id: cardId, title, position })
    .select()
    .single();
  if (error) throw error;
  return data as Subtask;
}

export async function updateSubtask(id: string, updates: Partial<Pick<Subtask, 'title' | 'completed' | 'position'>>): Promise<Subtask> {
  const { data, error } = await supabase
    .from('subtasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Subtask;
}

export async function deleteSubtask(id: string): Promise<void> {
  const { error } = await supabase.from('subtasks').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderSubtasks(subtasks: { id: string; position: number }[]): Promise<void> {
  await Promise.all(
    subtasks.map(sub => supabase.from('subtasks').update({ position: sub.position }).eq('id', sub.id))
  );
}

// ─── Column Transitions (Cycle Time) ────────────────────────

export async function getColumnTransitions(boardId: string): Promise<ColumnTransition[]> {
  const { data, error } = await supabase
    .from('column_transitions')
    .select('*')
    .eq('board_id', boardId)
    .order('transitioned_at', { ascending: true });
  if (error) throw error;
  return data as ColumnTransition[];
}

export interface CycleTimeMetrics {
  avgCycleTime: number; // days from first non-backlog column to done
  avgTimePerColumn: { columnId: string; avgDays: number }[];
  completedCount: number;
  fastestCard: { cardId: string; days: number } | null;
  slowestCard: { cardId: string; days: number } | null;
}

export function computeCycleTimeMetrics(
  transitions: ColumnTransition[],
  columns: Column[],
): CycleTimeMetrics {
  const doneCol = columns.find(c => c.is_done);
  const backlogCol = columns.length > 0
    ? [...columns].sort((a, b) => a.position - b.position)[0]
    : null;

  // Group transitions by card
  const byCard = new Map<string, ColumnTransition[]>();
  for (const t of transitions) {
    const existing = byCard.get(t.card_id) || [];
    existing.push(t);
    byCard.set(t.card_id, existing);
  }

  // Compute time per column per card
  const columnTimes = new Map<string, number[]>(); // columnId -> array of durations in ms
  const cycleTimes: { cardId: string; days: number }[] = [];

  for (const [cardId, trans] of byCard.entries()) {
    const sorted = [...trans].sort((a, b) =>
      new Date(a.transitioned_at).getTime() - new Date(b.transitioned_at).getTime()
    );

    // Track time spent in each column
    for (let i = 0; i < sorted.length; i++) {
      const enterTime = new Date(sorted[i].transitioned_at).getTime();
      const exitTime = i + 1 < sorted.length
        ? new Date(sorted[i + 1].transitioned_at).getTime()
        : Date.now();
      const colId = sorted[i].to_column_id;

      const existing = columnTimes.get(colId) || [];
      existing.push(exitTime - enterTime);
      columnTimes.set(colId, existing);
    }

    // Cycle time: first move out of backlog to arrival in done
    if (doneCol) {
      const firstActive = sorted.find(t =>
        backlogCol ? t.from_column_id === backlogCol.id : false
      );
      const reachedDone = sorted.find(t => t.to_column_id === doneCol.id);

      if (firstActive && reachedDone) {
        const start = new Date(firstActive.transitioned_at).getTime();
        const end = new Date(reachedDone.transitioned_at).getTime();
        const days = (end - start) / (1000 * 60 * 60 * 24);
        cycleTimes.push({ cardId, days });
      }
    }
  }

  // Averages
  const avgCycleTime = cycleTimes.length > 0
    ? cycleTimes.reduce((sum, ct) => sum + ct.days, 0) / cycleTimes.length
    : 0;

  const avgTimePerColumn = columns
    .filter(c => !c.is_done)
    .map(col => {
      const times = columnTimes.get(col.id) || [];
      const avg = times.length > 0
        ? times.reduce((s, t) => s + t, 0) / times.length / (1000 * 60 * 60 * 24)
        : 0;
      return { columnId: col.id, avgDays: avg };
    });

  const sorted = [...cycleTimes].sort((a, b) => a.days - b.days);

  return {
    avgCycleTime,
    avgTimePerColumn,
    completedCount: cycleTimes.length,
    fastestCard: sorted.length > 0 ? sorted[0] : null,
    slowestCard: sorted.length > 0 ? sorted[sorted.length - 1] : null,
  };
}

// ─── Card Templates ─────────────────────────────────────────

export async function getCardTemplates(boardId: string): Promise<CardTemplate[]> {
  const { data, error } = await supabase.from('card_templates').select('*').eq('board_id', boardId).order('position');
  if (error) throw error;
  return data as CardTemplate[];
}

export async function createCardTemplate(
  boardId: string,
  name: string,
  templateData: CardTemplate['template_data'],
  position: number
): Promise<CardTemplate> {
  const { data, error } = await supabase
    .from('card_templates')
    .insert({ board_id: boardId, name, template_data: templateData, position })
    .select()
    .single();
  if (error) throw error;
  return data as CardTemplate;
}

export async function deleteCardTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('card_templates').delete().eq('id', id);
  if (error) throw error;
}

// ─── Labels ─────────────────────────────────────────────────

export async function getLabels(boardId: string): Promise<Label[]> {
  const { data, error } = await supabase.from('labels').select('*').eq('board_id', boardId).order('created_at');
  if (error) throw error;
  return data as Label[];
}

export async function createLabel(boardId: string, name: string, color: string): Promise<Label> {
  const { data, error } = await supabase.from('labels').insert({ board_id: boardId, name, color }).select().single();
  if (error) throw error;
  return data as Label;
}

export async function updateLabel(id: string, updates: Partial<Pick<Label, 'name' | 'color'>>): Promise<void> {
  const { error } = await supabase.from('labels').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteLabel(id: string): Promise<void> {
  const { error } = await supabase.from('labels').delete().eq('id', id);
  if (error) throw error;
}

export async function getCardLabels(boardId: string): Promise<CardLabel[]> {
  // Get all card_labels for cards on this board
  const { data, error } = await supabase
    .from('card_labels')
    .select('card_id, label_id, cards!inner(board_id)')
    .eq('cards.board_id', boardId);
  if (error) throw error;
  return (data || []).map((d: Record<string, unknown>) => ({ card_id: d.card_id as string, label_id: d.label_id as string }));
}

export async function addCardLabel(cardId: string, labelId: string): Promise<void> {
  const { error } = await supabase.from('card_labels').insert({ card_id: cardId, label_id: labelId });
  if (error && error.code !== '23505') throw error; // Ignore duplicate
}

export async function removeCardLabel(cardId: string, labelId: string): Promise<void> {
  const { error } = await supabase.from('card_labels').delete().eq('card_id', cardId).eq('label_id', labelId);
  if (error) throw error;
}

// ─── Saved Filters ──────────────────────────────────────────

export async function getSavedFilters(boardId: string): Promise<SavedFilter[]> {
  const { data, error } = await supabase
    .from('saved_filters')
    .select('*')
    .eq('board_id', boardId)
    .order('position');
  if (error) throw error;
  return data as SavedFilter[];
}

export async function createSavedFilter(
  boardId: string,
  name: string,
  filters: SavedFilter['filters'],
  position: number
): Promise<SavedFilter> {
  const { data, error } = await supabase
    .from('saved_filters')
    .insert({ board_id: boardId, name, filters, position })
    .select()
    .single();
  if (error) throw error;
  return data as SavedFilter;
}

export async function updateSavedFilter(
  id: string,
  updates: Partial<Pick<SavedFilter, 'name' | 'filters' | 'position'>>
): Promise<void> {
  const { error } = await supabase.from('saved_filters').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteSavedFilter(id: string): Promise<void> {
  const { error } = await supabase.from('saved_filters').delete().eq('id', id);
  if (error) throw error;
}

// ─── CFD Snapshots ──────────────────────────────────────────

export async function getCfdSnapshots(boardId: string, days: number = 30): Promise<CfdSnapshot[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('cfd_snapshots')
    .select('*')
    .eq('board_id', boardId)
    .gte('snapshot_date', sinceStr)
    .order('snapshot_date', { ascending: true });
  if (error) throw error;
  return data as CfdSnapshot[];
}

export async function captureCfdSnapshot(boardId: string): Promise<void> {
  const { error } = await supabase.rpc('capture_cfd_snapshot', { p_board_id: boardId });
  if (error) throw error;
}

// ─── User Preferences ────────────────────────────────────────

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // Row not found, create default preferences
    const { data: newPrefs, error: insertError } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        overdue_notifications: true,
        notification_email: null,
        notification_time: '08:00:00',
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return newPrefs as UserPreferences;
  }

  if (error) throw error;
  return data as UserPreferences;
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<Omit<UserPreferences, 'user_id' | 'created_at'>>
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as UserPreferences;
}

// ─── Activity Log ───────────────────────────────────────────

export async function getActivityLog(boardId: string, limit = 50, offset = 0): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data as ActivityLogEntry[];
}

export async function getCardActivityLog(cardId: string): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ActivityLogEntry[];
}

export async function logActivity(
  boardId: string,
  action: ActivityAction,
  details: Record<string, unknown> = {},
  cardId?: string
): Promise<ActivityLogEntry> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('activity_log')
    .insert({
      board_id: boardId,
      card_id: cardId || null,
      user_id: user.id,
      action,
      details,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ActivityLogEntry;
}

// ─── Card Comments ──────────────────────────────────────────

export async function getCardComments(cardId: string): Promise<CardComment[]> {
  const { data, error } = await supabase
    .from('card_comments')
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as CardComment[];
}

export async function createCardComment(
  cardId: string,
  boardId: string,
  body: string,
  parentId?: string
): Promise<CardComment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('card_comments')
    .insert({
      card_id: cardId,
      board_id: boardId,
      user_id: user.id,
      parent_id: parentId || null,
      body,
    })
    .select()
    .single();
  if (error) throw error;
  return data as CardComment;
}

export async function updateCardComment(id: string, body: string): Promise<void> {
  const { error } = await supabase
    .from('card_comments')
    .update({ body, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteCardComment(id: string): Promise<void> {
  const { error } = await supabase
    .from('card_comments')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─── Card Relationships ─────────────────────────────────────

export async function getCardRelationships(boardId: string): Promise<CardRelationship[]> {
  const { data, error } = await supabase
    .from('card_relationships')
    .select('*')
    .eq('board_id', boardId);
  if (error) throw error;
  return data as CardRelationship[];
}

export async function createCardRelationship(
  boardId: string,
  sourceCardId: string,
  targetCardId: string,
  relationshipType: RelationshipType
): Promise<CardRelationship> {
  const { data, error } = await supabase
    .from('card_relationships')
    .insert({
      board_id: boardId,
      source_card_id: sourceCardId,
      target_card_id: targetCardId,
      relationship_type: relationshipType,
    })
    .select()
    .single();
  if (error) throw error;
  return data as CardRelationship;
}

export async function deleteCardRelationship(id: string): Promise<void> {
  const { error } = await supabase
    .from('card_relationships')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─── Card Attachments ───────────────────────────────────────

export async function getCardAttachments(cardId: string): Promise<CardAttachment[]> {
  const { data, error } = await supabase
    .from('card_attachments')
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as CardAttachment[];
}

export async function uploadCardAttachment(
  cardId: string,
  boardId: string,
  file: File
): Promise<CardAttachment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const ext = file.name.split('.').pop() || 'bin';
  const storagePath = `${user.id}/${cardId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('card-attachments')
    .upload(storagePath, file, { contentType: file.type });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('card_attachments')
    .insert({
      card_id: cardId,
      board_id: boardId,
      user_id: user.id,
      file_name: file.name,
      file_size: file.size,
      content_type: file.type,
      storage_path: storagePath,
    })
    .select()
    .single();
  if (error) {
    // Clean up orphaned storage blob if metadata insert fails
    await supabase.storage.from('card-attachments').remove([storagePath]);
    throw error;
  }
  return data as CardAttachment;
}

export async function deleteCardAttachment(id: string, storagePath: string): Promise<void> {
  // Delete metadata first (source of truth), then clean up storage
  const { error } = await supabase
    .from('card_attachments')
    .delete()
    .eq('id', id);
  if (error) throw error;
  // Storage cleanup — best effort, orphan is acceptable vs metadata pointing to missing file
  const { error: storageError } = await supabase.storage.from('card-attachments').remove([storagePath]);
  if (storageError) console.error('Storage cleanup failed:', storageError);
}

export async function getAttachmentSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('card-attachments')
    .createSignedUrl(storagePath, 3600); // 1 hour expiry
  if (error) throw error;
  return data.signedUrl;
}
