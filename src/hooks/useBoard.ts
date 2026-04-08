'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Board, Column, Category, Card, Epic, Subtask, ColumnTransition, CfdSnapshot, SavedFilter, Label, CardLabel, CardTemplate, CardRelationship, RelationshipType, RecurrenceRule } from '@/types/database';
import * as actions from '@/lib/board-actions';

function computeNextDueDate(currentDue: string, rule: RecurrenceRule): string {
  const d = new Date(currentDue + 'T00:00:00');
  switch (rule) {
    case 'daily': d.setDate(d.getDate() + 1); break;
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'biweekly': d.setDate(d.getDate() + 14); break;
    case 'monthly': {
      const targetMonth = (d.getMonth() + 1) % 12;
      d.setMonth(d.getMonth() + 1);
      // Clamp overflow (e.g. Jan 31 → Mar 3 → Feb 28)
      if (d.getMonth() !== targetMonth) d.setDate(0);
      break;
    }
    case 'quarterly': {
      const targetMonth = (d.getMonth() + 3) % 12;
      d.setMonth(d.getMonth() + 3);
      if (d.getMonth() !== targetMonth) d.setDate(0);
      break;
    }
  }
  return d.toISOString().split('T')[0];
}

export function useBoard() {
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [subtasks, setSubtasks] = useState<Record<string, Subtask[]>>({});
  const [transitions, setTransitions] = useState<ColumnTransition[]>([]);
  const [cfdSnapshots, setCfdSnapshots] = useState<CfdSnapshot[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [cardLabels, setCardLabels] = useState<CardLabel[]>([]);
  const [cardTemplates, setCardTemplates] = useState<CardTemplate[]>([]);
  const [cardRelationships, setCardRelationships] = useState<CardRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = useCallback(async (retries = 3) => {
    try {
      setLoading(true);
      setError(null);
      const b = await actions.getOrCreateBoard();
      setBoard(b);

      const [cols, cats, crds, eps, trans, snaps, filters, lbls, clbls, tmpls, rels] = await Promise.all([
        actions.getColumns(b.id),
        actions.getCategories(b.id),
        actions.getCards(b.id),
        actions.getEpics(b.id),
        actions.getColumnTransitions(b.id),
        actions.getCfdSnapshots(b.id),
        actions.getSavedFilters(b.id),
        actions.getLabels(b.id),
        actions.getCardLabels(b.id),
        actions.getCardTemplates(b.id),
        actions.getCardRelationships(b.id),
      ]);

      setColumns(cols);
      setCategories(cats);
      setCards(crds);
      setEpics(eps);
      setTransitions(trans);
      setCfdSnapshots(snaps);
      setSavedFilters(filters);
      setLabels(lbls);
      setCardLabels(clbls);
      setCardTemplates(tmpls);
      setCardRelationships(rels);

      // Capture today's snapshot (upsert — idempotent)
      actions.captureCfdSnapshot(b.id).catch(() => {});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load board';
      // Auth lock contention — retry after a short delay
      if (message.includes('lock') && message.includes('stolen') && retries > 0) {
        await new Promise(r => setTimeout(r, 500 * (4 - retries)));
        return loadBoard(retries - 1);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBoard(); }, [loadBoard]);

  // ─── Card actions ────────────────────────────────────────

  const addCard = useCallback(async (card: Omit<Card, 'id' | 'created_at' | 'updated_at'>) => {
    const newCard = await actions.createCard(card);
    setCards(prev => [...prev, newCard]);
    if (board) actions.logActivity(board.id, 'card_created', { title: newCard.title }, newCard.id).catch(() => {});
    return newCard;
  }, [board]);

  const editCard = useCallback(async (id: string, updates: Partial<Omit<Card, 'id' | 'board_id' | 'created_at'>>) => {
    await actions.updateCard(id, updates);
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c));
    if (board) actions.logActivity(board.id, 'card_updated', { fields: Object.keys(updates) }, id).catch(() => {});
  }, [board]);

  const removeCard = useCallback(async (id: string) => {
    const card = cards.find(c => c.id === id);
    // Log before delete — card_id FK is SET NULL on delete so history survives
    if (board) await actions.logActivity(board.id, 'card_deleted', { title: card?.title }, id).catch(() => {});
    await actions.deleteCard(id);
    setCards(prev => prev.filter(c => c.id !== id));
  }, [board, cards]);

  const moveCardToColumn = useCallback(async (cardId: string, columnId: string) => {
    const card = cards.find(c => c.id === cardId);
    const nextPosition = cards.filter(c => c.column_id === columnId).length;
    const now = new Date().toISOString();
    await actions.updateCard(cardId, { column_id: columnId, position: nextPosition, column_changed_at: now });
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, column_id: columnId, position: nextPosition, column_changed_at: now } : c));
    if (board) actions.logActivity(board.id, 'card_moved', { from_column: card?.column_id, to_column: columnId }, cardId).catch(() => {});

    // Recurring task: if moved to a done column, spawn a new card in the first column
    const targetCol = columns.find(c => c.id === columnId);
    if (card?.recurrence_rule && targetCol?.is_done && board) {
      // Guard: check if a spawned copy already exists in a non-done column
      const alreadySpawned = cards.some(c =>
        c.recurrence_source_id === card.id &&
        !columns.find(col => col.id === c.column_id)?.is_done
      );
      const firstCol = columns.find(c => !c.is_done);
      if (firstCol && !alreadySpawned) {
        const nextDue = card.due_date ? computeNextDueDate(card.due_date, card.recurrence_rule) : null;
        const spawnedCard = await actions.createCard({
          board_id: board.id,
          title: card.title,
          description: card.description,
          category_id: card.category_id,
          epic_id: card.epic_id,
          priority: card.priority,
          effort: card.effort,
          notes: card.notes,
          due_date: nextDue,
          estimated_hours: card.estimated_hours,
          actual_hours: null,
          archived_at: null,
          column_id: firstCol.id,
          position: cards.filter(c => c.column_id === firstCol.id).length,
          column_changed_at: now,
          recurrence_rule: card.recurrence_rule,
          recurrence_source_id: card.id,
        });
        setCards(prev => [...prev, spawnedCard]);
      }
    }
  }, [board, cards, columns]);

  const archiveCard = useCallback(async (id: string) => {
    const card = cards.find(c => c.id === id);
    await actions.archiveCard(id);
    setCards(prev => prev.filter(c => c.id !== id));
    if (board) actions.logActivity(board.id, 'card_archived', { title: card?.title }, id).catch(() => {});
  }, [board, cards]);

  const unarchiveCard = useCallback(async (card: Card) => {
    await actions.unarchiveCard(card.id);
    setCards(prev => [...prev, { ...card, archived_at: null }]);
    if (board) actions.logActivity(board.id, 'card_unarchived', { title: card.title }, card.id).catch(() => {});
  }, [board]);

  const archiveEpicCards = useCallback(async (epicId: string) => {
    const archivedIds = await actions.archiveEpicCards(epicId);
    setCards(prev => prev.filter(c => !archivedIds.includes(c.id)));
    // Also mark epic status as archived
    await actions.updateEpic(epicId, { status: 'archived', archived_at: new Date().toISOString() });
    setEpics(prev => prev.map(e => e.id === epicId ? { ...e, status: 'archived', archived_at: new Date().toISOString(), updated_at: new Date().toISOString() } : e));
  }, []);

  // ─── Epic actions ────────────────────────────────────────

  const addEpic = useCallback(async (epic: Omit<Epic, 'id' | 'created_at' | 'updated_at'>) => {
    const newEpic = await actions.createEpic(epic);
    setEpics(prev => [...prev, newEpic]);
    return newEpic;
  }, []);

  const editEpic = useCallback(async (id: string, updates: Partial<Omit<Epic, 'id' | 'board_id' | 'created_at'>>) => {
    await actions.updateEpic(id, updates);
    setEpics(prev => prev.map(e => e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e));
  }, []);

  const removeEpic = useCallback(async (id: string) => {
    await actions.deleteEpic(id);
    setEpics(prev => prev.filter(e => e.id !== id));
    // Unlink cards locally
    setCards(prev => prev.map(c => c.epic_id === id ? { ...c, epic_id: null } : c));
  }, []);

  // ─── Column actions ──────────────────────────────────────

  const addColumn = useCallback(async (title: string, color: string) => {
    if (!board) return;
    const col = await actions.createColumn(board.id, title, color, columns.length);
    setColumns(prev => [...prev, col]);
  }, [board, columns.length]);

  const editColumn = useCallback(async (id: string, updates: Partial<Pick<Column, 'title' | 'color' | 'position' | 'is_done' | 'wip_limit'>>) => {
    await actions.updateColumn(id, updates);
    setColumns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const removeColumn = useCallback(async (id: string) => {
    await actions.deleteColumn(id);
    setColumns(prev => prev.filter(c => c.id !== id));
  }, []);

  const reorderColumns = useCallback(async (newColumns: Column[]) => {
    setColumns(newColumns);
    const reorders = newColumns.map((c, i) => ({ id: c.id, position: i }));
    await actions.reorderColumns(reorders);
  }, []);

  // ─── Category actions ────────────────────────────────────

  const addCategory = useCallback(async (label: string, color: string) => {
    if (!board) return;
    const cat = await actions.createCategory(board.id, label, color, categories.length);
    setCategories(prev => [...prev, cat]);
  }, [board, categories.length]);

  const editCategory = useCallback(async (id: string, updates: Partial<Pick<Category, 'label' | 'color' | 'position'>>) => {
    await actions.updateCategory(id, updates);
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const removeCategory = useCallback(async (id: string) => {
    await actions.deleteCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  // ─── Label actions ───────────────────────────────────────

  const addLabel = useCallback(async (name: string, color: string) => {
    if (!board) return;
    const label = await actions.createLabel(board.id, name, color);
    setLabels(prev => [...prev, label]);
    return label;
  }, [board]);

  const editLabel = useCallback(async (id: string, updates: Partial<Pick<Label, 'name' | 'color'>>) => {
    await actions.updateLabel(id, updates);
    setLabels(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  const removeLabel = useCallback(async (id: string) => {
    await actions.deleteLabel(id);
    setLabels(prev => prev.filter(l => l.id !== id));
    setCardLabels(prev => prev.filter(cl => cl.label_id !== id));
  }, []);

  const toggleCardLabel = useCallback(async (cardId: string, labelId: string) => {
    const exists = cardLabels.find(cl => cl.card_id === cardId && cl.label_id === labelId);
    if (exists) {
      await actions.removeCardLabel(cardId, labelId);
      setCardLabels(prev => prev.filter(cl => !(cl.card_id === cardId && cl.label_id === labelId)));
    } else {
      await actions.addCardLabel(cardId, labelId);
      setCardLabels(prev => [...prev, { card_id: cardId, label_id: labelId }]);
    }
  }, [cardLabels]);

  // ─── Card Template actions ────────────────────────────────

  const addCardTemplate = useCallback(async (name: string, templateData: CardTemplate['template_data']) => {
    if (!board) return;
    const position = cardTemplates.length;
    const newTemplate = await actions.createCardTemplate(board.id, name, templateData, position);
    setCardTemplates(prev => [...prev, newTemplate]);
    return newTemplate;
  }, [board, cardTemplates.length]);

  const removeCardTemplate = useCallback(async (id: string) => {
    await actions.deleteCardTemplate(id);
    setCardTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  // ─── Card Relationship actions ────────────────────────────

  const addCardRelationship = useCallback(async (sourceCardId: string, targetCardId: string, relationshipType: RelationshipType) => {
    if (!board) return;
    const rel = await actions.createCardRelationship(board.id, sourceCardId, targetCardId, relationshipType);
    setCardRelationships(prev => [...prev, rel]);
    return rel;
  }, [board]);

  const removeCardRelationship = useCallback(async (id: string) => {
    await actions.deleteCardRelationship(id);
    setCardRelationships(prev => prev.filter(r => r.id !== id));
  }, []);

  // ─── Saved Filter actions ────────────────────────────────

  const addSavedFilter = useCallback(async (name: string, filters: SavedFilter['filters']) => {
    if (!board) return;
    const position = savedFilters.length;
    const newFilter = await actions.createSavedFilter(board.id, name, filters, position);
    setSavedFilters(prev => [...prev, newFilter]);
    return newFilter;
  }, [board, savedFilters.length]);

  const removeSavedFilter = useCallback(async (id: string) => {
    await actions.deleteSavedFilter(id);
    setSavedFilters(prev => prev.filter(f => f.id !== id));
  }, []);

  // ─── Subtask actions ─────────────────────────────────────

  const loadSubtasks = useCallback(async (cardId: string) => {
    const subs = await actions.getSubtasks(cardId);
    setSubtasks(prev => ({ ...prev, [cardId]: subs }));
  }, []);

  const addSubtask = useCallback(async (cardId: string, title: string) => {
    const existingSubs = subtasks[cardId] || [];
    const position = existingSubs.length;
    const newSubtask = await actions.createSubtask(cardId, title, position);
    setSubtasks(prev => ({
      ...prev,
      [cardId]: [...(prev[cardId] || []), newSubtask],
    }));
    return newSubtask;
  }, [subtasks]);

  const toggleSubtask = useCallback(async (cardId: string, subtaskId: string) => {
    const current = subtasks[cardId]?.find(s => s.id === subtaskId);
    if (!current) return;
    const newCompleted = !current.completed;
    await actions.updateSubtask(subtaskId, { completed: newCompleted });
    setSubtasks(prev => ({
      ...prev,
      [cardId]: (prev[cardId] || []).map(s => s.id === subtaskId ? { ...s, completed: newCompleted } : s),
    }));
  }, [subtasks]);

  const removeSubtask = useCallback(async (cardId: string, subtaskId: string) => {
    await actions.deleteSubtask(subtaskId);
    setSubtasks(prev => ({
      ...prev,
      [cardId]: (prev[cardId] || []).filter(s => s.id !== subtaskId),
    }));
  }, []);

  const editSubtask = useCallback(async (cardId: string, subtaskId: string, title: string) => {
    await actions.updateSubtask(subtaskId, { title });
    setSubtasks(prev => ({
      ...prev,
      [cardId]: (prev[cardId] || []).map(s => s.id === subtaskId ? { ...s, title } : s),
    }));
  }, []);

  return {
    board, columns, categories, cards, epics, subtasks, transitions, cfdSnapshots, savedFilters, labels, cardLabels, cardTemplates, cardRelationships, loading, error,
    addCard, editCard, removeCard, moveCardToColumn, archiveCard, unarchiveCard, archiveEpicCards,
    addEpic, editEpic, removeEpic,
    addColumn, editColumn, removeColumn, reorderColumns,
    addCategory, editCategory, removeCategory,
    loadSubtasks, addSubtask, toggleSubtask, removeSubtask, editSubtask,
    addLabel, editLabel, removeLabel, toggleCardLabel,
    addCardTemplate, removeCardTemplate,
    addCardRelationship, removeCardRelationship,
    addSavedFilter, removeSavedFilter,
    refresh: loadBoard,
    // Internal setters for realtime updates (not part of public API)
    __setCards: setCards,
    __setColumns: setColumns,
    __setCategories: setCategories,
    __setEpics: setEpics,
    __setSubtasks: setSubtasks,
    __setTransitions: setTransitions,
  };
}
