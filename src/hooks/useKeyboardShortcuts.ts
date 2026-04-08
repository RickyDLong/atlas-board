'use client';

import { useEffect, useCallback } from 'react';

interface ShortcutActions {
  onNewCard: () => void;
  onFocusSearch: () => void;
  onCloseModal: () => void;
  onToggleEpics: () => void;
  onToggleSettings: () => void;
  onToggleFilters: () => void;
  onShowHelp: () => void;
  onUndo?: () => Promise<void>;
  onRedo?: () => Promise<void>;
}

export function useKeyboardShortcuts(actions: ShortcutActions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't fire when typing in inputs/textareas
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

    // Escape always works (close modals)
    if (e.key === 'Escape') {
      actions.onCloseModal();
      return;
    }

    // Handle undo/redo with modifiers (Ctrl+Z / Cmd+Z, Ctrl+Shift+Z / Cmd+Shift+Z)
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isUndo = (isMac ? e.metaKey : e.ctrlKey) && e.key === 'z' && !e.shiftKey;
    const isRedo = (isMac ? e.metaKey : e.ctrlKey) && e.key === 'z' && e.shiftKey;

    if (isUndo && actions.onUndo) {
      e.preventDefault();
      actions.onUndo();
      return;
    }

    if (isRedo && actions.onRedo) {
      e.preventDefault();
      actions.onRedo();
      return;
    }

    // All other shortcuts suppressed when in an input
    if (isInput) return;

    // Don't fire with modifier keys (except shift for ?)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    switch (e.key) {
      case 'n':
        e.preventDefault();
        actions.onNewCard();
        break;
      case '/':
        e.preventDefault();
        actions.onFocusSearch();
        break;
      case 'e':
        e.preventDefault();
        actions.onToggleEpics();
        break;
      case 's':
        e.preventDefault();
        actions.onToggleSettings();
        break;
      case 'f':
        e.preventDefault();
        actions.onToggleFilters();
        break;
      case '?':
        e.preventDefault();
        actions.onShowHelp();
        break;
    }
  }, [actions]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export const SHORTCUTS = [
  { key: 'Cmd+Z / Ctrl+Z', description: 'Undo' },
  { key: 'Cmd+Shift+Z / Ctrl+Shift+Z', description: 'Redo' },
  { key: 'N', description: 'New card' },
  { key: '/', description: 'Focus search' },
  { key: 'E', description: 'Toggle epics panel' },
  { key: 'S', description: 'Toggle settings' },
  { key: 'F', description: 'Toggle filters' },
  { key: '?', description: 'Show this help' },
  { key: 'Esc', description: 'Close modal / panel' },
];
