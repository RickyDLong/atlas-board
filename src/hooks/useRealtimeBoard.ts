'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useBoard } from '@/hooks/useBoard';
import { createClient } from '@/lib/supabase/client';
import type { Card, Column, Category, Epic, Subtask, ColumnTransition } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

type RealtimeBoardReturn = ReturnType<typeof useBoard>;
type BoardHookWithSetters = RealtimeBoardReturn & {
  __setCards: (fn: (prev: Card[]) => Card[] | Card[]) => void;
  __setColumns: (fn: (prev: Column[]) => Column[] | Column[]) => void;
  __setCategories: (fn: (prev: Category[]) => Category[] | Category[]) => void;
  __setEpics: (fn: (prev: Epic[]) => Epic[] | Epic[]) => void;
  __setSubtasks: (fn: (prev: Record<string, Subtask[]>) => Record<string, Subtask[]>) => void;
  __setTransitions: (fn: (prev: ColumnTransition[]) => ColumnTransition[] | ColumnTransition[]) => void;
};

type PostgresPayload<T> = {
  new: T;
  old: T;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
};

/** How long to keep realtime handlers muted after a local mutation (ms) */
const REALTIME_MUTE_MS = 500;

// Strip internal setters from the public API
type PublicBoardAPI = Omit<RealtimeBoardReturn, '__setCards' | '__setColumns' | '__setCategories' | '__setEpics' | '__setSubtasks' | '__setTransitions'>;

export function useRealtimeBoard(): PublicBoardAPI {
  const boardHook = useBoard();
  const {
    board, columns, categories, cards, epics, subtasks, transitions, cfdSnapshots, savedFilters, labels, cardLabels, cardTemplates, cardRelationships, loading, error,
    __setCards, __setColumns, __setCategories, __setEpics, __setSubtasks,
    // Destructure all action methods so we can wrap them
    addCard, editCard, removeCard, moveCardToColumn, archiveCard, unarchiveCard, archiveEpicCards, archiveDoneCards,
    addEpic, editEpic, removeEpic,
    addColumn, editColumn, removeColumn, reorderColumns,
    addCategory, editCategory, removeCategory,
    loadSubtasks, addSubtask, toggleSubtask, removeSubtask, editSubtask,
    addLabel, editLabel, removeLabel, toggleCardLabel,
    addCardTemplate, removeCardTemplate,
    addCardRelationship, removeCardRelationship,
    addSavedFilter, removeSavedFilter,
    refresh,
  } = boardHook as BoardHookWithSetters;

  const muteRealtimeRef = useRef(false);
  const muteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const channelRef = useRef<ReturnType<SupabaseClient['channel']> | null>(null);
  // Keep a ref to current card IDs for subtask filtering
  const cardIdsRef = useRef<Set<string>>(new Set());

  // Keep card IDs ref in sync
  useEffect(() => {
    cardIdsRef.current = new Set(cards.map(c => c.id));
  }, [cards]);

  // ─── Muting helper ──────────────────────────────────────
  // Temporarily mutes realtime handlers during local mutations
  // to prevent double-applying optimistic updates.
  const withMute = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    muteRealtimeRef.current = true;
    if (muteTimerRef.current) clearTimeout(muteTimerRef.current);
    try {
      return await fn();
    } finally {
      // Keep muted after the mutation completes to allow
      // the CDC event to arrive and be ignored
      muteTimerRef.current = setTimeout(() => {
        muteRealtimeRef.current = false;
      }, REALTIME_MUTE_MS);
    }
  }, []);

  // ─── Wrapped action methods ─────────────────────────────
  const mutedAddCard = useCallback(
    (card: Parameters<typeof addCard>[0]) => withMute(() => addCard(card)),
    [addCard, withMute]
  );
  const mutedEditCard = useCallback(
    (id: string, updates: Parameters<typeof editCard>[1]) => withMute(() => editCard(id, updates)),
    [editCard, withMute]
  );
  const mutedRemoveCard = useCallback(
    (id: string) => withMute(() => removeCard(id)),
    [removeCard, withMute]
  );
  const mutedMoveCardToColumn = useCallback(
    (cardId: string, columnId: string) => withMute(() => moveCardToColumn(cardId, columnId)),
    [moveCardToColumn, withMute]
  );
  const mutedArchiveCard = useCallback(
    (id: string) => withMute(() => archiveCard(id)),
    [archiveCard, withMute]
  );
  const mutedUnarchiveCard = useCallback(
    (card: Card) => withMute(() => unarchiveCard(card)),
    [unarchiveCard, withMute]
  );
  const mutedArchiveEpicCards = useCallback(
    (epicId: string) => withMute(() => archiveEpicCards(epicId)),
    [archiveEpicCards, withMute]
  );
  const mutedArchiveDoneCards = useCallback(
    (doneColumnId: string) => withMute(() => archiveDoneCards(doneColumnId)),
    [archiveDoneCards, withMute]
  );
  const mutedAddEpic = useCallback(
    (epic: Parameters<typeof addEpic>[0]) => withMute(() => addEpic(epic)),
    [addEpic, withMute]
  );
  const mutedEditEpic = useCallback(
    (id: string, updates: Parameters<typeof editEpic>[1]) => withMute(() => editEpic(id, updates)),
    [editEpic, withMute]
  );
  const mutedRemoveEpic = useCallback(
    (id: string) => withMute(() => removeEpic(id)),
    [removeEpic, withMute]
  );
  const mutedAddColumn = useCallback(
    (title: string, color: string) => withMute(() => addColumn(title, color)),
    [addColumn, withMute]
  );
  const mutedEditColumn = useCallback(
    (id: string, updates: Parameters<typeof editColumn>[1]) => withMute(() => editColumn(id, updates)),
    [editColumn, withMute]
  );
  const mutedRemoveColumn = useCallback(
    (id: string) => withMute(() => removeColumn(id)),
    [removeColumn, withMute]
  );
  const mutedReorderColumns = useCallback(
    (newColumns: Column[]) => withMute(() => reorderColumns(newColumns)),
    [reorderColumns, withMute]
  );
  const mutedAddCategory = useCallback(
    (label: string, color: string) => withMute(() => addCategory(label, color)),
    [addCategory, withMute]
  );
  const mutedEditCategory = useCallback(
    (id: string, updates: Parameters<typeof editCategory>[1]) => withMute(() => editCategory(id, updates)),
    [editCategory, withMute]
  );
  const mutedRemoveCategory = useCallback(
    (id: string) => withMute(() => removeCategory(id)),
    [removeCategory, withMute]
  );
  const mutedAddSubtask = useCallback(
    (cardId: string, title: string) => withMute(() => addSubtask(cardId, title)),
    [addSubtask, withMute]
  );
  const mutedToggleSubtask = useCallback(
    (cardId: string, subtaskId: string) => withMute(() => toggleSubtask(cardId, subtaskId)),
    [toggleSubtask, withMute]
  );
  const mutedRemoveSubtask = useCallback(
    (cardId: string, subtaskId: string) => withMute(() => removeSubtask(cardId, subtaskId)),
    [removeSubtask, withMute]
  );
  const mutedEditSubtask = useCallback(
    (cardId: string, subtaskId: string, title: string) => withMute(() => editSubtask(cardId, subtaskId, title)),
    [editSubtask, withMute]
  );

  // ─── Realtime subscriptions ─────────────────────────────
  useEffect(() => {
    if (!board) return;

    const supabase = createClient();
    supabaseRef.current = supabase;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel: any = supabase.channel(`board-${board.id}`, {
      config: { broadcast: { self: false } },
    });

    // Subscribe to cards
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'cards', filter: `board_id=eq.${board.id}` },
      (payload: PostgresPayload<Card>) => {
        if (muteRealtimeRef.current) return;
        __setCards((prev) => [...prev, payload.new]);
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'cards', filter: `board_id=eq.${board.id}` },
      (payload: PostgresPayload<Card>) => {
        if (muteRealtimeRef.current) return;
        __setCards((prev) => prev.map((c) => (c.id === payload.new.id ? payload.new : c)));
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'cards', filter: `board_id=eq.${board.id}` },
      (payload: PostgresPayload<Card>) => {
        if (muteRealtimeRef.current) return;
        __setCards((prev) => prev.filter((c) => c.id !== payload.old.id));
      }
    );

    // Subscribe to columns
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'columns', filter: `board_id=eq.${board.id}` },
      (payload: PostgresPayload<Column>) => {
        if (muteRealtimeRef.current) return;
        __setColumns((prev) => [...prev, payload.new]);
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'columns', filter: `board_id=eq.${board.id}` },
      (payload: PostgresPayload<Column>) => {
        if (muteRealtimeRef.current) return;
        __setColumns((prev) => prev.map((c) => (c.id === payload.new.id ? payload.new : c)));
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'columns', filter: `board_id=eq.${board.id}` },
      (payload: PostgresPayload<Column>) => {
        if (muteRealtimeRef.current) return;
        __setColumns((prev) => prev.filter((c) => c.id !== payload.old.id));
      }
    );

    // Subscribe to categories
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'categories', filter: `board_id=eq.${board.id}` },
      (payload: PostgresPayload<Category>) => {
        if (muteRealtimeRef.current) return;
        __setCategories((prev) => [...prev, payload.new]);
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'categories', filter: `board_id=eq.${board.id}` },
      (payload: PostgresPayload<Category>) => {
        if (muteRealtimeRef.current) return;
        __setCategories((prev) => prev.map((c) => (c.id === payload.new.id ? payload.new : c)));
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'categories', filter: `board_id=eq.${board.id}` },
      (payload: PostgresPayload<Category>) => {
        if (muteRealtimeRef.current) return;
        __setCategories((prev) => prev.filter((c) => c.id !== payload.old.id));
      }
    );

    // Subscribe to epics
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'epics', filter: `board_id=eq.${board.id}` },
      (payload: PostgresPayload<Epic>) => {
        if (muteRealtimeRef.current) return;
        __setEpics((prev) => [...prev, payload.new]);
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'epics', filter: `board_id=eq.${board.id}` },
      (payload: PostgresPayload<Epic>) => {
        if (muteRealtimeRef.current) return;
        __setEpics((prev) => prev.map((e) => (e.id === payload.new.id ? payload.new : e)));
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'epics', filter: `board_id=eq.${board.id}` },
      (payload: PostgresPayload<Epic>) => {
        if (muteRealtimeRef.current) return;
        __setEpics((prev) => prev.filter((e) => e.id !== payload.old.id));
      }
    );

    // Subscribe to subtasks — client-side filtered to only this board's cards
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'subtasks' },
      (payload: PostgresPayload<Subtask>) => {
        if (muteRealtimeRef.current) return;
        if (!cardIdsRef.current.has(payload.new.card_id)) return;
        __setSubtasks((prev) => ({
          ...prev,
          [payload.new.card_id]: [...(prev[payload.new.card_id] || []), payload.new],
        }));
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'subtasks' },
      (payload: PostgresPayload<Subtask>) => {
        if (muteRealtimeRef.current) return;
        if (!cardIdsRef.current.has(payload.new.card_id)) return;
        __setSubtasks((prev) => ({
          ...prev,
          [payload.new.card_id]: (prev[payload.new.card_id] || []).map((s) =>
            s.id === payload.new.id ? payload.new : s
          ),
        }));
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'subtasks' },
      (payload: PostgresPayload<Subtask>) => {
        if (muteRealtimeRef.current) return;
        if (!cardIdsRef.current.has(payload.old.card_id)) return;
        __setSubtasks((prev) => ({
          ...prev,
          [payload.old.card_id]: (prev[payload.old.card_id] || []).filter(
            (s) => s.id !== payload.old.id
          ),
        }));
      }
    );

    // Subscribe to the channel
    channel.subscribe();
    channelRef.current = channel;

    // Cleanup — use removeChannel for full cleanup
    return () => {
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
      }
      if (muteTimerRef.current) clearTimeout(muteTimerRef.current);
    };
  }, [board, __setCards, __setColumns, __setCategories, __setEpics, __setSubtasks]);

  // ─── Return wrapped API ─────────────────────────────────
  return useMemo(() => ({
    board, columns, categories, cards, epics, subtasks, transitions, cfdSnapshots, savedFilters, labels, cardLabels, cardTemplates, cardRelationships, loading, error,
    addCard: mutedAddCard,
    editCard: mutedEditCard,
    removeCard: mutedRemoveCard,
    moveCardToColumn: mutedMoveCardToColumn,
    archiveCard: mutedArchiveCard,
    unarchiveCard: mutedUnarchiveCard,
    archiveEpicCards: mutedArchiveEpicCards,
    archiveDoneCards: mutedArchiveDoneCards,
    addEpic: mutedAddEpic,
    editEpic: mutedEditEpic,
    removeEpic: mutedRemoveEpic,
    addColumn: mutedAddColumn,
    editColumn: mutedEditColumn,
    removeColumn: mutedRemoveColumn,
    reorderColumns: mutedReorderColumns,
    addCategory: mutedAddCategory,
    editCategory: mutedEditCategory,
    removeCategory: mutedRemoveCategory,
    loadSubtasks,
    addLabel, editLabel, removeLabel, toggleCardLabel,
    addCardTemplate, removeCardTemplate,
    addCardRelationship, removeCardRelationship,
    addSavedFilter,
    removeSavedFilter,
    addSubtask: mutedAddSubtask,
    toggleSubtask: mutedToggleSubtask,
    removeSubtask: mutedRemoveSubtask,
    editSubtask: mutedEditSubtask,
    refresh,
  }), [
    board, columns, categories, cards, epics, subtasks, transitions, cfdSnapshots, savedFilters, labels, cardLabels, cardTemplates, cardRelationships, loading, error,
    mutedAddCard, mutedEditCard, mutedRemoveCard, mutedMoveCardToColumn,
    mutedArchiveCard, mutedUnarchiveCard, mutedArchiveEpicCards, mutedArchiveDoneCards,
    mutedAddEpic, mutedEditEpic, mutedRemoveEpic,
    mutedAddColumn, mutedEditColumn, mutedRemoveColumn, mutedReorderColumns,
    mutedAddCategory, mutedEditCategory, mutedRemoveCategory,
    loadSubtasks, addLabel, editLabel, removeLabel, toggleCardLabel, addCardTemplate, removeCardTemplate, addCardRelationship, removeCardRelationship, addSavedFilter, removeSavedFilter, mutedAddSubtask, mutedToggleSubtask, mutedRemoveSubtask, mutedEditSubtask,
    refresh,
  ]);
}
