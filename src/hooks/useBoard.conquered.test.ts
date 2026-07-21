import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { mockBoard, mockColumns, mockCategories, mockCards, mockEpics } from '@/__tests__/fixtures';

// board-actions is the persistence layer moveCardToColumn writes through. Keep the
// real module (so every export the hook touches exists) but override the loaders and
// the writes the test exercises, so nothing hits Supabase and we can assert intent.
vi.mock('@/lib/board-actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/board-actions')>()),
  getOrCreateBoard: vi.fn(),
  getColumns: vi.fn(),
  getCategories: vi.fn(),
  getCards: vi.fn(),
  getEpics: vi.fn(),
  getColumnTransitions: vi.fn(),
  getCfdSnapshots: vi.fn(),
  getSavedFilters: vi.fn(),
  getLabels: vi.fn(),
  getCardLabels: vi.fn(),
  getCardTemplates: vi.fn(),
  getCardRelationships: vi.fn(),
  captureCfdSnapshot: vi.fn(),
  updateCard: vi.fn(),
  logActivity: vi.fn(),
  createCard: vi.fn(),
}));

import * as actions from '@/lib/board-actions';
import { useBoard } from './useBoard';

const DONE_COLUMN = 'col-done'; // is_done: true (Conquered)
const IN_PROGRESS_COLUMN = 'col-inprogress'; // is_done: false
const ACTIVE_CARD = 'card-2'; // starts in col-inprogress (not done)
const CONQUERED_CARD = 'card-3'; // starts in col-done with a conquered_at

async function renderLoadedBoard() {
  const view = renderHook(() => useBoard());
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

function persistedConqueredAt(cardId: string): string | null | undefined {
  const call = (actions.updateCard as ReturnType<typeof vi.fn>).mock.calls
    .filter(([id]) => id === cardId)
    .at(-1);
  return call?.[1]?.conquered_at;
}

describe('useBoard.moveCardToColumn conquered_at', () => {
  beforeEach(() => {
    vi.mocked(actions.getOrCreateBoard).mockResolvedValue(mockBoard);
    vi.mocked(actions.getColumns).mockResolvedValue(mockColumns);
    vi.mocked(actions.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(actions.getCards).mockResolvedValue(mockCards.map(c => ({ ...c })));
    vi.mocked(actions.getEpics).mockResolvedValue(mockEpics);
    vi.mocked(actions.getColumnTransitions).mockResolvedValue([]);
    vi.mocked(actions.getCfdSnapshots).mockResolvedValue([]);
    vi.mocked(actions.getSavedFilters).mockResolvedValue([]);
    vi.mocked(actions.getLabels).mockResolvedValue([]);
    vi.mocked(actions.getCardLabels).mockResolvedValue([]);
    vi.mocked(actions.getCardTemplates).mockResolvedValue([]);
    vi.mocked(actions.getCardRelationships).mockResolvedValue([]);
    vi.mocked(actions.captureCfdSnapshot).mockResolvedValue(undefined as never);
    vi.mocked(actions.updateCard).mockResolvedValue(undefined);
    vi.mocked(actions.logActivity).mockResolvedValue(undefined as never);
    // Only fake Date so `new Date().toISOString()` is deterministic; leave real
    // timers alone so waitFor's polling still works during the initial load.
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('stamps conquered_at with the move time when a card enters the done column', async () => {
    const conqueredTime = '2026-05-01T10:00:00.000Z';
    const { result } = await renderLoadedBoard();

    vi.setSystemTime(new Date(conqueredTime));
    await act(async () => {
      await result.current.moveCardToColumn(ACTIVE_CARD, DONE_COLUMN);
    });

    expect(persistedConqueredAt(ACTIVE_CARD)).toBe(conqueredTime);
    expect(result.current.cards.find(c => c.id === ACTIVE_CARD)?.conquered_at).toBe(conqueredTime);
  });

  it('clears conquered_at when a card leaves the done column', async () => {
    const { result } = await renderLoadedBoard();

    vi.setSystemTime(new Date('2026-05-02T09:00:00.000Z'));
    await act(async () => {
      await result.current.moveCardToColumn(CONQUERED_CARD, IN_PROGRESS_COLUMN);
    });

    expect(persistedConqueredAt(CONQUERED_CARD)).toBeNull();
    expect(result.current.cards.find(c => c.id === CONQUERED_CARD)?.conquered_at).toBeNull();
  });

  it('keeps only the newest conquered time across a move-out and re-entry', async () => {
    const firstTime = '2026-05-01T10:00:00.000Z';
    const newestTime = '2026-05-03T15:30:00.000Z';
    const { result } = await renderLoadedBoard();

    vi.setSystemTime(new Date(firstTime));
    await act(async () => { await result.current.moveCardToColumn(ACTIVE_CARD, DONE_COLUMN); });

    vi.setSystemTime(new Date('2026-05-02T12:00:00.000Z'));
    await act(async () => { await result.current.moveCardToColumn(ACTIVE_CARD, IN_PROGRESS_COLUMN); });

    vi.setSystemTime(new Date(newestTime));
    await act(async () => { await result.current.moveCardToColumn(ACTIVE_CARD, DONE_COLUMN); });

    const conqueredAt = result.current.cards.find(c => c.id === ACTIVE_CARD)?.conquered_at;
    expect(conqueredAt).toBe(newestTime);
    expect(conqueredAt).not.toBe(firstTime);
  });
});
