'use client';

import { useEffect, useRef } from 'react';
import { useBoard } from '@/hooks/useBoard';
import { createClient } from '@/lib/supabase/client';
import type { Card, Column, Category, Epic, Subtask } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeBoardReturn = ReturnType<typeof useBoard>;
type BoardHookWithSetters = RealtimeBoardReturn & {
  __setCards: (fn: (prev: Card[]) => Card[]) => void;
  __setColumns: (fn: (prev: Column[]) => Column[]) => void;
  __setCategories: (fn: (prev: Category[]) => Category[]) => void;
  __setEpics: (fn: (prev: Epic[]) => Epic[]) => void;
  __setSubtasks: (fn: (prev: Record<string, Subtask[]>) => Record<string, Subtask[]>) => void;
};

type PostgresPayload<T> = {
  new: T;
  old: T;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
};

export function useRealtimeBoard(): Omit<RealtimeBoardReturn, '__setCards' | '__setColumns' | '__setCategories' | '__setEpics' | '__setSubtasks'> {
  const boardHook = useBoard();
  const { board, __setCards, __setColumns, __setCategories, __setEpics, __setSubtasks } = boardHook as BoardHookWithSetters;

  const muteRealtimeRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!board) return;

    const supabase = createClient();

    // Create a single channel for this board
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

    // Subscribe to subtasks (no board_id filter, client-side filtering by card_id)
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'subtasks' },
      (payload: PostgresPayload<Subtask>) => {
        if (muteRealtimeRef.current) return;
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

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [board, __setCards, __setColumns, __setCategories, __setEpics, __setSubtasks]);

  return boardHook as Omit<RealtimeBoardReturn, '__setCards' | '__setColumns' | '__setCategories' | '__setEpics' | '__setSubtasks'>;
}
