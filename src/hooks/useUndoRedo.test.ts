import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoRedo, type UndoableAction } from './useUndoRedo';

function makeAction(over: Partial<UndoableAction> = {}): UndoableAction {
  return {
    id: over.id ?? 'action-1',
    type: over.type ?? 'edit_card',
    description: over.description ?? 'Edit card',
    undo: over.undo ?? vi.fn().mockResolvedValue(undefined),
    redo: over.redo ?? vi.fn().mockResolvedValue(undefined),
    timestamp: over.timestamp ?? 1,
  };
}

describe('useUndoRedo', () => {
  it('starts with empty stacks', () => {
    const { result } = renderHook(() => useUndoRedo());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.lastAction).toBeNull();
    expect(result.current.undoStack).toHaveLength(0);
    expect(result.current.redoStack).toHaveLength(0);
  });

  it('pushAction makes the action undoable and exposes it as lastAction', () => {
    const { result } = renderHook(() => useUndoRedo());
    act(() => { result.current.pushAction(makeAction({ id: 'x1', description: 'Move card' })); });
    expect(result.current.canUndo).toBe(true);
    expect(result.current.lastAction?.id).toBe('x1');
    expect(result.current.lastAction?.description).toBe('Move card');
  });

  it('undo runs the action undo fn and moves it onto the redo stack', async () => {
    const undoFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useUndoRedo());
    act(() => { result.current.pushAction(makeAction({ id: 'x1', undo: undoFn })); });

    await act(async () => { await result.current.undo(); });

    expect(undoFn).toHaveBeenCalledOnce();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('redo runs the action redo fn and moves it back onto the undo stack', async () => {
    const redoFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useUndoRedo());
    act(() => { result.current.pushAction(makeAction({ id: 'x1', redo: redoFn })); });
    await act(async () => { await result.current.undo(); });

    await act(async () => { await result.current.redo(); });

    expect(redoFn).toHaveBeenCalledOnce();
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('pushing a new action clears the redo stack', async () => {
    const { result } = renderHook(() => useUndoRedo());
    act(() => { result.current.pushAction(makeAction({ id: 'x1' })); });
    await act(async () => { await result.current.undo(); });
    expect(result.current.canRedo).toBe(true);

    act(() => { result.current.pushAction(makeAction({ id: 'x2' })); });
    expect(result.current.canRedo).toBe(false);
  });

  it('caps the undo stack at 20 actions, keeping the most recent', () => {
    const { result } = renderHook(() => useUndoRedo());
    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.pushAction(makeAction({ id: `a${i}`, description: `Action ${i}` }));
      }
    });
    expect(result.current.undoStack).toHaveLength(20);
    expect(result.current.lastAction?.id).toBe('a24'); // newest at the front
    const ids = result.current.undoStack.map((a) => a.id);
    expect(ids).not.toContain('a4'); // oldest five dropped
    expect(ids).toContain('a5');
  });

  it('undo is a no-op when the undo stack is empty', async () => {
    const { result } = renderHook(() => useUndoRedo());
    await act(async () => { await result.current.undo(); });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('propagates undo errors and leaves the stacks unchanged', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useUndoRedo());
    act(() => {
      result.current.pushAction(makeAction({ id: 'x1', undo: vi.fn().mockRejectedValue(new Error('nope')) }));
    });

    await act(async () => {
      await expect(result.current.undo()).rejects.toThrow('nope');
    });

    expect(result.current.canUndo).toBe(true); // action stays on the stack
    expect(result.current.canRedo).toBe(false);
    errSpy.mockRestore();
  });
});
