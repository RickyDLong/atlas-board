'use client';

import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';

/**
 * Debounced, optimistic editor for a collection of `{ id }` records held in
 * React state.
 *
 * The SettingsModal name/color inputs are controlled and fire `onChange` on
 * every keystroke and color-picker tick. Persisting each of those directly is
 * wrong on two counts: awaiting the network before updating local state makes
 * the controlled input revert / drop characters mid-type, and it hammers
 * Supabase with one write per keystroke.
 *
 * This hook fixes both, generically:
 *  - `edit` updates local state immediately (optimistic) so the input stays
 *    responsive, then coalesces the writes behind a per-id debounce.
 *  - Pending field changes accumulate per id, so a rapid label-then-color edit
 *    persists both in a single write.
 *  - If a persist fails, exactly the fields that were optimistically changed
 *    are rolled back to their pre-edit values (leaving concurrent updates to
 *    other fields — e.g. from realtime — intact).
 *  - Any pending write is flushed on unmount so the last keystroke before a
 *    navigation isn't lost.
 *
 * State still lives in the caller's `useState`; this hook only owns timers and
 * the pending/rollback bookkeeping, so it is not a parallel state store.
 */
export function useDebouncedEditor<T extends { id: string }, U extends Partial<T>>(
  items: T[],
  setItems: Dispatch<SetStateAction<T[]>>,
  persist: (id: string, updates: U) => Promise<unknown>,
  delay = 400,
) {
  // Mirror of the latest committed items, read synchronously when snapshotting
  // rollback values (state itself isn't readable inside the edit callback).
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pending = useRef<Record<string, U>>({});
  const rollback = useRef<Record<string, Partial<T>>>({});

  const flush = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    const updates = pending.current[id];
    if (!updates) return;
    delete pending.current[id];
    const snapshot = rollback.current[id];
    delete rollback.current[id];
    persist(id, updates).catch((err) => {
      console.error('Failed to persist edit', err);
      if (snapshot) {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...snapshot } : it)));
      }
    });
  }, [persist, setItems]);

  const edit = useCallback((id: string, updates: U): Promise<void> => {
    // Snapshot the pre-edit value of each field being changed, once per debounce
    // window, so a failed persist can restore exactly those fields.
    const current = itemsRef.current.find((it) => it.id === id);
    if (current) {
      // Fresh object (don't mutate the one stored in the ref) merging any
      // fields already snapshotted this window with the newly-touched ones.
      const snap: Partial<T> = { ...rollback.current[id] };
      for (const key of Object.keys(updates) as (keyof T)[]) {
        if (!(key in snap)) snap[key] = current[key];
      }
      rollback.current[id] = snap;
    }
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)));
    pending.current[id] = { ...pending.current[id], ...updates } as U;
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => flush(id), delay);
    return Promise.resolve();
  }, [setItems, flush, delay]);

  /** Drop any pending write for `id` (e.g. when the record is being deleted). */
  const cancel = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    delete pending.current[id];
    delete rollback.current[id];
  }, []);

  useEffect(() => {
    const timersRef = timers.current;
    const pendingRef = pending.current;
    return () => {
      for (const id of Object.keys(timersRef)) {
        clearTimeout(timersRef[id]);
        const updates = pendingRef[id];
        if (updates) {
          persist(id, updates).catch((err) => console.error('Failed to persist edit on unmount', err));
        }
      }
    };
  }, [persist]);

  return { edit, cancel };
}
