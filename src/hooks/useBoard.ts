'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Board, Column, Category, Card, Epic } from '@/types/database';
import * as actions from '@/lib/board-actions';

export function useBoard() {
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = useCallback(async () => {
    try {
      setLoading(true);
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
      setError(err instanceof Error ? err.message : 'Failed to load board');
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
    await actions.moveCard(cardId, columnId);
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, column_id: columnId } : c));
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

  return {
    board, columns, categories, cards, epics, loading, error,
    addCard, editCard, removeCard, moveCardToColumn,
    addEpic, editEpic, removeEpic,
    addColumn, editColumn, removeColumn, reorderColumns,
    addCategory, editCategory, removeCategory,
    refresh: loadBoard,
  };
}
