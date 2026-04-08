'use client';

import { useState, useCallback } from 'react';

export interface UndoableAction {
  id: string; // unique action ID
  type: string; // e.g. 'move_card', 'delete_card', 'edit_card', 'archive_card'
  description: string; // human-readable, e.g. "Move 'Fix bug' to In Progress"
  undo: () => Promise<void>; // function to reverse the action
  redo: () => Promise<void>; // function to re-apply the action
  timestamp: number;
}

const MAX_STACK_SIZE = 20;

export function useUndoRedo() {
  const [undoStack, setUndoStack] = useState<UndoableAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoableAction[]>([]);

  const pushAction = useCallback((action: UndoableAction) => {
    setUndoStack(prev => {
      const updated = [action, ...prev];
      return updated.length > MAX_STACK_SIZE ? updated.slice(0, MAX_STACK_SIZE) : updated;
    });
    // Clear redo stack when new action is pushed
    setRedoStack([]);
  }, []);

  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;

    const action = undoStack[0];
    try {
      await action.undo();
      setUndoStack(prev => prev.slice(1));
      setRedoStack(prev => [action, ...prev]);
    } catch (err) {
      console.error('Undo failed:', err);
      throw err;
    }
  }, [undoStack]);

  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;

    const action = redoStack[0];
    try {
      await action.redo();
      setRedoStack(prev => prev.slice(1));
      setUndoStack(prev => [action, ...prev]);
    } catch (err) {
      console.error('Redo failed:', err);
      throw err;
    }
  }, [redoStack]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;
  const lastAction = undoStack.length > 0 ? undoStack[0] : null;

  return {
    pushAction,
    undo,
    redo,
    canUndo,
    canRedo,
    lastAction,
    undoStack,
    redoStack,
  };
}
