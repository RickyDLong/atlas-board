import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';
import { useDebouncedEditor } from './useDebouncedEditor';

type Item = { id: string; label: string; color: string };

const seed = (): Item[] => [
  { id: 'a', label: 'Alpha', color: '#111111' },
  { id: 'b', label: 'Beta', color: '#222222' },
];

// Harness that owns the state, mirroring how useBoard wires the editor to a
// useState collection.
function useHarness(persist: (id: string, u: Partial<Item>) => Promise<unknown>, delay = 400) {
  const [items, setItems] = useState<Item[]>(seed);
  const editor = useDebouncedEditor<Item, Partial<Item>>(items, setItems, persist, delay);
  return { items, ...editor };
}

const byId = (items: Item[], id: string) => items.find((i) => i.id === id)!;

describe('useDebouncedEditor', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('applies the edit to local state immediately (optimistic) before persisting', () => {
    const persist = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useHarness(persist));

    act(() => { result.current.edit('a', { label: 'Alpha!' }); });

    expect(byId(result.current.items, 'a').label).toBe('Alpha!');
    expect(persist).not.toHaveBeenCalled();
  });

  it('persists exactly once after the debounce delay elapses', () => {
    const persist = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useHarness(persist, 400));

    act(() => { result.current.edit('a', { label: 'X' }); });
    act(() => { vi.advanceTimersByTime(399); });
    expect(persist).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(1); });
    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith('a', { label: 'X' });
  });

  it('coalesces rapid edits to the same id into one write with merged fields', () => {
    const persist = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useHarness(persist));

    act(() => {
      result.current.edit('a', { label: 'One' });
      result.current.edit('a', { color: '#999999' });
      result.current.edit('a', { label: 'Two' });
    });
    act(() => { vi.advanceTimersByTime(400); });

    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith('a', { label: 'Two', color: '#999999' });
    expect(byId(result.current.items, 'a').label).toBe('Two');
    expect(byId(result.current.items, 'a').color).toBe('#999999');
  });

  it('debounces each id on its own timer', () => {
    const persist = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useHarness(persist));

    act(() => {
      result.current.edit('a', { label: 'AA' });
      result.current.edit('b', { label: 'BB' });
    });
    act(() => { vi.advanceTimersByTime(400); });

    expect(persist).toHaveBeenCalledTimes(2);
    expect(persist).toHaveBeenCalledWith('a', { label: 'AA' });
    expect(persist).toHaveBeenCalledWith('b', { label: 'BB' });
  });

  it('rolls back the changed fields when the persist rejects', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const persist = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useHarness(persist));

    act(() => { result.current.edit('a', { label: 'Broken' }); });
    expect(byId(result.current.items, 'a').label).toBe('Broken'); // optimistic

    await act(async () => { await vi.advanceTimersByTimeAsync(400); });

    expect(persist).toHaveBeenCalledTimes(1);
    expect(byId(result.current.items, 'a').label).toBe('Alpha'); // restored
    errSpy.mockRestore();
  });

  it('cancel() drops a pending write so it never persists', () => {
    const persist = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useHarness(persist));

    act(() => { result.current.edit('a', { label: 'Z' }); });
    act(() => { result.current.cancel('a'); });
    act(() => { vi.advanceTimersByTime(400); });

    expect(persist).not.toHaveBeenCalled();
  });

  it('flushes a pending write on unmount so the last keystroke is not lost', () => {
    const persist = vi.fn().mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() => useHarness(persist));

    act(() => { result.current.edit('a', { label: 'Q' }); });
    unmount();

    expect(persist).toHaveBeenCalledWith('a', { label: 'Q' });
  });
});
