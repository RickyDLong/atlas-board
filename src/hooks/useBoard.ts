'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Board, Column, Category, Card, Epic, Subtask } from '@/types/database';
import * as actions from '@/lib/board-actions';

export function useBoard() {
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [subtasks, setSubtasks] = useState<Record<string, Subtask[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = useCallback(async (retries = 3) => {
    try {
      setLoading(true);
      setError(null);
      const b = await actions.getOrCreateBoard();
      setBoard(b);

      const [cols, cats, crds, eps] = await Promise.all([
        actions.getColumns(b.id),
        actions.getCategories(b.id),
        actions.getCards(b.id),
        actions.getEpics(b.id),
      ]);

      setColumns(cols);
      setCategories(cats);
      setCards(crds);
      setEpics(eps);
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
    return newCard;
  }, []);

  const editCard = useCallback(async (id: string, updates: Partial<Omit<Card, 'id' | 'board_id' | 'created_at'>>) => {
    await actions.updateCard(id, updates);
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c));
  }, []);

  const removeCard = useCallback(async (id: string) => {
    await actions.deleteCard(id);
    setCards(prev => prev.filter(c => c.id !== id));
  }, []);

  const moveCardToColumn = useCallback(async (cardId: string, columnId: string) => {
    const nextPosition = cards.filter(c => c.column_id === columnId).length;
    const now = new Date().toISOString();
    await actions.updateCard(cardId, { column_id: columnId, position: nextPosition, column_changed_at: now });
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, column_id: columnId, position: nextPosition, column_changed_at: now } : c));
  }, [cards]);

  const archiveCard = useCallback(async (id: string) => {
    await actions.archiveCard(id);
    setCards(prev => prev.filter(c => c.id !== id));
  }, []);

  const unarchiveCard = useCallback(async (card: Card) => {
    await actions.unarchiveCard(card.id);
    setCards(prev => [...prev, { ...card, archived_at: null }]);
  }, []);

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

  const editColumn = useCallback(async (id: string, updates: Partial<Pick<Column, 'title' | 'color' | 'position'>>) => {
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
    board, columns, categories, cards, epics, subtasks, loading, error,
    addCard, editCard, removeCard, moveCardToColumn, archiveCard, unarchiveCard, archiveEpicCards,
    addEpic, editEpic, removeEpic,
    addColumn, editColumn, removeColumn, reorderColumns,
    addCategory, editCategory, removeCategory,
    loadSubtasks, addSubtask, toggleSubtask, removeSubtask, editSubtask,
    refresh: loadBoard,
    // Internal setters for realtime updates (not part of public API)
    __setCards: setCards,
    __setColumns: setColumns,
    __setCategories: setCategories,
    __setEpics: setEpics,
    __setSubtasks: setSubtasks,
  };
}
