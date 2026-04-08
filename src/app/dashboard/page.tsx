'use client';

import { useRealtimeBoard } from '@/hooks/useRealtimeBoard';
import { useGamification } from '@/hooks/useGamification';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { GamificationModeProvider, useGamificationMode } from '@/contexts/GamificationModeContext';
import { BoardColumn } from '@/components/board/BoardColumn';
import { CardModal } from '@/components/board/CardModal';
import { EpicPanel } from '@/components/board/EpicPanel';
import { SettingsModal } from '@/components/board/SettingsModal';
import { XPBar } from '@/components/board/XPBar';
import { XPToastStack } from '@/components/board/XPToast';
import { LevelUpCelebration } from '@/components/board/LevelUpCelebration';
import { BadgePanel } from '@/components/board/BadgePanel';
import { UndoToast } from '@/components/board/UndoToast';
import { WelcomeModal } from '@/components/board/WelcomeModal';
import { PRIORITIES } from '@/types/database';
import type { Card } from '@/types/database';
import { signOut, getCurrentUser, getUserPreferences, updateUserPreferences } from '@/lib/board-actions';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ShortcutsModal } from '@/components/board/ShortcutsModal';
import { CalendarView } from '@/components/board/CalendarView';
import { StatsView } from '@/components/board/StatsView';
import { ListView } from '@/components/board/ListView';
import { ArchivePanel } from '@/components/board/ArchivePanel';
import { AtlasLogo } from '@/components/AtlasLogo';

type ViewMode = 'board' | 'calendar' | 'stats' | 'list';

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then(u => setUserId(u?.id || null));
  }, []);

  return (
    <GamificationModeProvider userId={userId}>
      <DashboardContent />
    </GamificationModeProvider>
  );
}

function DashboardContent() {
  const {
    board, columns, categories, cards, epics, subtasks, loading, error,
    addCard, editCard, removeCard, moveCardToColumn, archiveCard, unarchiveCard, archiveEpicCards,
    addEpic, editEpic, removeEpic,
    addColumn, editColumn, removeColumn, reorderColumns,
    addCategory, editCategory, removeCategory,
    loadSubtasks, addSubtask, toggleSubtask, removeSubtask, editSubtask,
    refresh,
  } = useRealtimeBoard();

  const router = useRouter();
  const { isGamified, toggleGamification } = useGamificationMode();
  const [showWelcome, setShowWelcome] = useState(false);
  const undoRedo = useUndoRedo();
  const [activeUndoToast, setActiveUndoToast] = useState<{ description: string; actionId: string } | null>(null);

  // Get userId from gamification context (which is set in parent)
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    getCurrentUser().then(u => setUserId(u?.id || null));
  }, []);

  // Check if user has seen onboarding
  useEffect(() => {
    if (!userId || loading) return;

    const checkOnboarding = async () => {
      try {
        const prefs = await getUserPreferences(userId);
        if (!prefs.has_seen_onboarding) {
          setShowWelcome(true);
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err);
      }
    };

    checkOnboarding();
  }, [userId, loading]);

  const gam = useGamification(userId, board?.id || null);
  const [showBadgePanel, setShowBadgePanel] = useState(false);
  const [levelUpDisplay, setLevelUpDisplay] = useState<{ level: number; title: string; color: string } | null>(null);
  const [prevLevel, setPrevLevel] = useState(0);

  // Detect level-ups — computed during render (React 19 pattern)
  const currentLevel = gam.level?.current_level ?? 0;
  if (currentLevel !== prevLevel) {
    if (prevLevel > 0 && currentLevel > prevLevel && gam.level) {
      setLevelUpDisplay({
        level: gam.level.current_level,
        title: gam.level.title,
        color: gam.levelColor,
      });
    }
    setPrevLevel(currentLevel);
  }

  const [showAddModal, setShowAddModal] = useState(false);
  const [addToColumnId, setAddToColumnId] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [detailCard, setDetailCard] = useState<Card | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showEpicPanel, setShowEpicPanel] = useState(false);
  const [selectedEpicId, setSelectedEpicId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ card: Card; x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterEpicId, setFilterEpicId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const searchRef = useRef<HTMLInputElement>(null);
  const [calendarDate, setCalendarDate] = useState<string | null>(null);

  const handleUndo = useCallback(async () => {
    await undoRedo.undo();
  }, [undoRedo]);

  const handleRedo = useCallback(async () => {
    await undoRedo.redo();
  }, [undoRedo]);

  const shortcutActions = useMemo(() => ({
    onNewCard: () => { setAddToColumnId(columns[0]?.id || null); setShowAddModal(true); },
    onFocusSearch: () => searchRef.current?.focus(),
    onCloseModal: () => {
      if (showShortcuts) { setShowShortcuts(false); return; }
      if (showAddModal) { setShowAddModal(false); return; }
      if (editingCard) { setEditingCard(null); return; }
      if (detailCard) { setDetailCard(null); return; }
      if (showSettings) { setShowSettings(false); return; }
      if (showEpicPanel) { setShowEpicPanel(false); setSelectedEpicId(null); return; }
      if (contextMenu) { setContextMenu(null); return; }
    },
    onToggleEpics: () => setShowEpicPanel(prev => !prev),
    onToggleSettings: () => setShowSettings(prev => !prev),
    onToggleFilters: () => setShowFilters(prev => !prev),
    onShowHelp: () => setShowShortcuts(prev => !prev),
    onUndo: handleUndo,
    onRedo: handleRedo,
  }), [columns, showShortcuts, showAddModal, editingCard, detailCard, showSettings, showEpicPanel, contextMenu, handleUndo, handleRedo]);

  useKeyboardShortcuts(shortcutActions);

  // ─── Gamified card actions ─────────────────────────────────
  const gamifiedAddCard = useCallback(async (card: Omit<Card, 'id' | 'created_at' | 'updated_at'>) => {
    const newCard = await addCard(card as Card);
    if (isGamified) {
      await gam.awardXP('card_create', { card_title: card.title });
    }
    return newCard;
  }, [addCard, gam, isGamified]);

  const gamifiedMoveCard = useCallback(async (cardId: string, columnId: string) => {
    await moveCardToColumn(cardId, columnId);
    // Check if moved to Done column (last column by position)
    const sorted = [...columns].sort((a, b) => a.position - b.position);
    const lastCol = sorted.length > 0 ? sorted[sorted.length - 1] : undefined;
    if (lastCol && columnId === lastCol.id && isGamified) {
      const card = cards.find(c => c.id === cardId);
      if (card) {
        await gam.awardCardCompletion(card);
      }
    }
  }, [moveCardToColumn, columns, cards, gam, isGamified]);

  // ─── Undoable card actions ────────────────────────────────────

  const undoableMoveCard = useCallback(async (cardId: string, columnId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const originalColumnId = card.column_id;

    await gamifiedMoveCard(cardId, columnId);

    // Find the target column name for description
    const targetColumn = columns.find(c => c.id === columnId);
    const targetName = targetColumn?.title || 'column';

    undoRedo.pushAction({
      id: `move_${cardId}_${Date.now()}`,
      type: 'move_card',
      description: `Move "${card.title}" to ${targetName}`,
      undo: async () => {
        await moveCardToColumn(cardId, originalColumnId);
      },
      redo: async () => {
        await gamifiedMoveCard(cardId, columnId);
      },
      timestamp: Date.now(),
    });

    setActiveUndoToast({ description: `Move "${card.title}" to ${targetName}`, actionId: `move_${cardId}_${Date.now()}` });
  }, [cards, columns, gamifiedMoveCard, moveCardToColumn, undoRedo]);

  const undoableArchiveCard = useCallback(async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    await archiveCard(cardId);

    undoRedo.pushAction({
      id: `archive_${cardId}_${Date.now()}`,
      type: 'archive_card',
      description: `Archive "${card.title}"`,
      undo: async () => {
        await unarchiveCard(card);
      },
      redo: async () => {
        await archiveCard(cardId);
      },
      timestamp: Date.now(),
    });

    setActiveUndoToast({ description: `Archive "${card.title}"`, actionId: `archive_${cardId}_${Date.now()}` });
  }, [cards, archiveCard, unarchiveCard, undoRedo]);

  const undoableRemoveCard = useCallback(async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    // Store full card data for undo
    const cardData = { ...card };

    await removeCard(cardId);

    undoRedo.pushAction({
      id: `delete_${cardId}_${Date.now()}`,
      type: 'delete_card',
      description: `Delete "${card.title}"`,
      undo: async () => {
        // Re-create card with original data (excluding id which will be auto-generated)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...cardWithoutMetadata } = cardData;
        const recreatedCard = await addCard(cardWithoutMetadata);
        // Update position to match original
        if (recreatedCard) {
          await editCard(recreatedCard.id, { position: cardData.position });
        }
      },
      redo: async () => {
        await removeCard(cardId);
      },
      timestamp: Date.now(),
    });

    setActiveUndoToast({ description: `Delete "${card.title}"`, actionId: `delete_${cardId}_${Date.now()}` });
  }, [cards, removeCard, addCard, editCard, undoRedo]);

  const undoableEditCard = useCallback(async (cardId: string, updates: Partial<Omit<Card, 'id' | 'board_id' | 'created_at'>>) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    // Store original values for all fields being updated
    const originalValues: Record<string, unknown> = {};
    Object.keys(updates).forEach(key => {
      originalValues[key] = card[key as keyof Card];
    });

    await editCard(cardId, updates);

    // Only show toast for significant edits (not real-time typing)
    const significantFields = ['priority', 'effort', 'epic_id', 'category_id'];
    const isSignificantEdit = Object.keys(updates).some(key => significantFields.includes(key));

    if (isSignificantEdit) {
      undoRedo.pushAction({
        id: `edit_${cardId}_${Date.now()}`,
        type: 'edit_card',
        description: `Edit "${card.title}"`,
        undo: async () => {
          await editCard(cardId, originalValues);
        },
        redo: async () => {
          await editCard(cardId, updates);
        },
        timestamp: Date.now(),
      });

      setActiveUndoToast({ description: `Edit "${card.title}"`, actionId: `edit_${cardId}_${Date.now()}` });
    }
  }, [cards, editCard, undoRedo]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-[#8888a0] text-sm">Loading your board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#f87171] text-sm mb-2">Failed to load board</div>
          <div className="text-[#555568] text-xs mb-4">{error}</div>
          <button onClick={() => refresh()} className="text-[#4a9eff] text-sm hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  // Filter cards
  const filteredCards = cards.filter(card => {
    if (filterCategories.length > 0 && !filterCategories.includes(card.category_id || '')) return false;
    if (filterPriority && card.priority !== filterPriority) return false;
    if (filterEpicId && card.epic_id !== filterEpicId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return card.title.toLowerCase().includes(q) || (card.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  const getColumnCards = (colId: string) => filteredCards.filter(c => c.column_id === colId).sort((a, b) => a.position - b.position);

  const sortedCols = [...columns].sort((a, b) => a.position - b.position);
  const doneCol = sortedCols.length > 0 ? sortedCols[sortedCols.length - 1] : undefined;
  const totalActive = cards.filter(c => !doneCol || c.column_id !== doneCol.id).length;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e2e] bg-[#12121a] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <AtlasLogo size={32} />
          <h1 className="text-lg font-semibold text-white tracking-tight">
            Atlas <span className="text-[#555568] font-normal ml-2 text-sm">{board?.name}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* XP Bar */}
          {isGamified && (
            <XPBar
              level={gam.level}
              streak={gam.streak}
              levelProgress={gam.levelProgress}
              xpInCurrentLevel={gam.xpInCurrentLevel}
              xpNeededForNext={gam.xpNeededForNext}
              levelColor={gam.levelColor}
              badgeCount={gam.badges.length}
              onClickStats={() => setShowBadgePanel(true)}
            />
          )}

          <input
            ref={searchRef}
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-[#1a1a26] border border-[#2a2a3a] rounded-lg px-3 py-1.5 text-[#e8e8f0] text-xs w-48 outline-none focus:border-[#4a9eff] transition-colors"
          />
          <div className="flex items-center bg-[#1a1a26] border border-[#2a2a3a] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('board')}
              className={`h-8 px-2.5 text-xs font-medium transition-all cursor-pointer ${viewMode === 'board' ? 'bg-[#22222f] text-white' : 'text-[#555568] hover:text-[#8888a0]'}`}
              title="Board view"
            >
              &#9638;
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`h-8 px-2.5 text-xs font-medium transition-all cursor-pointer ${viewMode === 'calendar' ? 'bg-[#22222f] text-white' : 'text-[#555568] hover:text-[#8888a0]'}`}
              title="Calendar view"
            >
              &#9776;
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`h-8 px-2.5 text-xs font-medium transition-all cursor-pointer ${viewMode === 'list' ? 'bg-[#22222f] text-white' : 'text-[#555568] hover:text-[#8888a0]'}`}
              title="List view"
            >
              &#9866;
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`h-8 px-2.5 text-xs font-medium transition-all cursor-pointer ${viewMode === 'stats' ? 'bg-[#22222f] text-white' : 'text-[#555568] hover:text-[#8888a0]'}`}
              title="Stats view"
            >
              &#9679;
            </button>
          </div>
          <button
            onClick={() => setShowWelcome(true)}
            className="w-8 h-8 bg-transparent border border-[#2a2a3a] text-[#8888a0] rounded-lg flex items-center justify-center hover:bg-[#1a1a26] hover:text-[#4a9eff] transition-all cursor-pointer"
            title="How it works"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <circle cx="12" cy="17" r="0.5" fill="currentColor" />
            </svg>
          </button>
          <button
            onClick={() => setShowShortcuts(true)}
            className="w-8 h-8 bg-transparent border border-[#2a2a3a] text-[#8888a0] rounded-lg flex items-center justify-center text-xs font-mono hover:bg-[#1a1a26] hover:text-white transition-all cursor-pointer"
            title="Keyboard shortcuts"
          >
            ?
          </button>
          <button
            onClick={() => setShowEpicPanel(true)}
            className="h-8 px-3 bg-transparent border border-[#2a2a3a] text-[#8888a0] rounded-lg text-xs font-medium hover:bg-[#1a1a26] hover:text-white transition-all cursor-pointer"
          >
            Epics
          </button>
          <button
            onClick={() => setShowArchive(true)}
            className="h-8 px-3 bg-transparent border border-[#2a2a3a] text-[#555568] rounded-lg text-xs font-medium hover:bg-[#1a1a26] hover:text-[#a855f7] transition-all cursor-pointer"
            title="View archive"
          >
            Archive
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 bg-transparent border border-[#2a2a3a] text-[#8888a0] rounded-lg flex items-center justify-center text-sm hover:bg-[#1a1a26] hover:text-white transition-all cursor-pointer"
            title="Settings"
          >
            &#9881;
          </button>
          <button
            onClick={toggleGamification}
            className="w-8 h-8 bg-transparent border border-[#2a2a3a] rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer"
            style={{ color: isGamified ? '#a855f7' : '#8888a0', borderColor: isGamified ? '#a855f7' : '#2a2a3a' }}
            title={isGamified ? 'RPG Mode (on)' : 'Clean Mode (on)'}
          >
            {isGamified ? '⚔' : '📋'}
          </button>
          <button
            onClick={() => { setAddToColumnId(columns[0]?.id || null); setShowAddModal(true); }}
            className="w-8 h-8 bg-transparent border border-[#2a2a3a] text-[#8888a0] rounded-lg flex items-center justify-center text-base hover:bg-[#1a1a26] hover:text-white transition-all cursor-pointer"
            title="New project"
          >
            +
          </button>
          <button
            onClick={handleSignOut}
            className="h-8 px-3 bg-transparent border border-[#2a2a3a] text-[#555568] rounded-lg text-xs hover:bg-[#1a1a26] hover:text-[#f87171] transition-all cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Filter bar */}
      <div className="flex items-center gap-1.5 px-6 py-3 border-b border-[#1e1e2e] bg-[#12121a] flex-wrap">
        <button
          onClick={() => setShowFilters(prev => !prev)}
          className={`px-3 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${showFilters || filterCategories.length > 0 || filterPriority || filterEpicId ? 'bg-[#1a1a26] border-[#4a9eff] text-[#4a9eff]' : 'bg-transparent border-[#2a2a3a] text-[#8888a0]'}`}
        >
          &#9707; Filter
        </button>

        {/* Active filter pills — always visible when filters are set */}
        {filterCategories.map(catId => {
          const cat = categories.find(c => c.id === catId);
          if (!cat) return null;
          return (
            <button
              key={cat.id}
              onClick={() => setFilterCategories(prev => prev.filter(c => c !== cat.id))}
              className="px-3 py-1 rounded-md text-xs font-medium border bg-[#1a1a26] transition-all cursor-pointer"
              style={{ borderColor: cat.color, color: cat.color }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: cat.color }} />
              {cat.label} &times;
            </button>
          );
        })}
        {filterPriority && (
          <button
            onClick={() => setFilterPriority(null)}
            className="px-3 py-1 rounded-md text-xs font-medium border bg-[#1a1a26] transition-all cursor-pointer"
            style={{ borderColor: PRIORITIES.find(p => p.id === filterPriority)?.color, color: PRIORITIES.find(p => p.id === filterPriority)?.color }}
          >
            {PRIORITIES.find(p => p.id === filterPriority)?.label} &times;
          </button>
        )}
        {filterEpicId && (() => {
          const epic = epics.find(e => e.id === filterEpicId);
          if (!epic) return null;
          return (
            <button
              onClick={() => setFilterEpicId(null)}
              className="px-3 py-1 rounded-md text-xs font-medium border bg-[#1a1a26] transition-all cursor-pointer"
              style={{ borderColor: epic.color, color: epic.color }}
            >
              &#9670; {epic.name} &times;
            </button>
          );
        })()}
        {(filterCategories.length > 0 || filterPriority || filterEpicId) && (
          <button
            onClick={() => { setFilterCategories([]); setFilterPriority(null); setFilterEpicId(null); }}
            className="px-3 py-1 rounded-md text-xs font-medium text-[#f87171] border-transparent cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Expanded filter options */}
      {showFilters && (
        <div className="px-6 py-3 border-b border-[#1e1e2e] bg-[#0e0e16] space-y-3">
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[#555568] text-[10px] uppercase tracking-wider font-semibold w-16 shrink-0">Category</span>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategories(prev => prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id])}
                  className={`px-3 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${filterCategories.includes(cat.id) ? 'bg-[#1a1a26]' : 'bg-transparent'}`}
                  style={filterCategories.includes(cat.id) ? { borderColor: cat.color, color: cat.color } : { borderColor: '#2a2a3a', color: '#8888a0' }}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: cat.color }} />
                  {cat.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#555568] text-[10px] uppercase tracking-wider font-semibold w-16 shrink-0">Priority</span>
            {PRIORITIES.map(p => (
              <button
                key={p.id}
                onClick={() => setFilterPriority(prev => prev === p.id ? null : p.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${filterPriority === p.id ? 'bg-[#1a1a26]' : 'bg-transparent'}`}
                style={filterPriority === p.id ? { borderColor: p.color, color: p.color } : { borderColor: '#2a2a3a', color: '#8888a0' }}
              >
                {p.label}
              </button>
            ))}
          </div>
          {epics.filter(e => e.status !== 'archived').length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[#555568] text-[10px] uppercase tracking-wider font-semibold w-16 shrink-0">Epic</span>
              {epics.filter(e => e.status !== 'archived').map(epic => (
                <button
                  key={epic.id}
                  onClick={() => setFilterEpicId(prev => prev === epic.id ? null : epic.id)}
                  className={`px-3 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${filterEpicId === epic.id ? 'bg-[#1a1a26]' : 'bg-transparent'}`}
                  style={filterEpicId === epic.id ? { borderColor: epic.color, color: epic.color } : { borderColor: '#2a2a3a', color: '#8888a0' }}
                >
                  &#9670; {epic.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 px-6 py-2.5 border-b border-[#1e1e2e] text-xs">
        <span className="text-[#555568]">Active <span className="font-mono font-semibold text-[#8888a0]">{totalActive}</span></span>
        <span className="text-[#555568]">Epics <span className="font-mono font-semibold text-[#8888a0]">{epics.filter(e => e.status === 'active').length}</span></span>
        <span className="text-[#555568]">Total <span className="font-mono font-semibold text-[#8888a0]">{cards.length}</span></span>
      </div>

      {/* Board / Calendar */}
      {viewMode === 'board' ? (
        <div className="flex gap-px min-h-[calc(100vh-140px)] bg-[#1e1e2e]">
          {columns.map(col => (
            <BoardColumn
              key={col.id}
              column={col}
              cards={getColumnCards(col.id)}
              categories={categories}
              columns={columns}
              subtasks={subtasks}
              onAddCard={(colId) => { setAddToColumnId(colId); setShowAddModal(true); }}
              onCardClick={(card) => setDetailCard(card)}
              onCardMenu={(card, x, y) => setContextMenu({ card, x, y })}
              onDrop={(colId, cardId) => undoableMoveCard(cardId, colId)}
            />
          ))}
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="flex flex-1 min-h-[calc(100vh-140px)] bg-[#0a0a0f]">
          <CalendarView
            cards={filteredCards}
            categories={categories}
            columns={columns}
            onCardClick={(card) => setDetailCard(card)}
            onAddCard={(date, columnId) => {
              setAddToColumnId(columnId);
              setShowAddModal(true);
              setCalendarDate(date);
            }}
          />
        </div>
      ) : viewMode === 'list' ? (
        <div className="flex min-h-[calc(100vh-140px)] bg-[#0a0a0f]">
          <ListView
            cards={filteredCards}
            categories={categories}
            columns={columns}
            epics={epics}
            onCardClick={(card) => setDetailCard(card)}
          />
        </div>
      ) : (
        <div className="flex min-h-[calc(100vh-140px)] bg-[#0a0a0f]">
          <StatsView cards={cards} categories={categories} columns={columns} epics={epics} />
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg p-1 min-w-[160px] shadow-xl"
            style={{
              left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 180 : contextMenu.x),
              top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 200 : contextMenu.y),
            }}
          >
            <button className="block w-full text-left px-3 py-1.5 text-xs text-[#8888a0] rounded hover:bg-[#22222f] hover:text-white transition-all"
              onClick={() => { setEditingCard(contextMenu.card); setContextMenu(null); }}>Edit</button>
            {columns.filter(c => c.id !== contextMenu.card.column_id).map(col => (
              <button key={col.id} className="block w-full text-left px-3 py-1.5 text-xs text-[#8888a0] rounded hover:bg-[#22222f] hover:text-white transition-all"
                onClick={() => { undoableMoveCard(contextMenu.card.id, col.id); setContextMenu(null); }}>
                Move to {col.title}
              </button>
            ))}
            {doneCol && contextMenu.card.column_id === doneCol.id && (
              <button className="block w-full text-left px-3 py-1.5 text-xs text-[#a855f7] rounded hover:bg-[#a855f710] transition-all"
                onClick={() => { undoableArchiveCard(contextMenu.card.id); setContextMenu(null); }}>Archive</button>
            )}
            <button className="block w-full text-left px-3 py-1.5 text-xs text-[#f87171] rounded hover:bg-[#f8717110] transition-all"
              onClick={() => { undoableRemoveCard(contextMenu.card.id); setContextMenu(null); }}>Delete</button>
          </div>
        </>
      )}

      {/* Card create/edit modal */}
      {(showAddModal || editingCard) && board && (() => {
        // Load subtasks for the card being edited
        if (editingCard && !subtasks[editingCard.id]) {
          loadSubtasks(editingCard.id);
        }
        return (
          <CardModal
            card={editingCard}
            boardId={board.id}
            defaultColumnId={addToColumnId || columns[0]?.id}
            categories={categories}
            columns={columns}
            epics={epics}
            nextPosition={cards.filter(c => c.column_id === (addToColumnId || columns[0]?.id)).length}
            defaultDueDate={!editingCard ? calendarDate : null}
            subtasks={editingCard ? (subtasks[editingCard.id] || []) : []}
            onAddSubtask={editingCard ? (title) => addSubtask(editingCard.id, title) : undefined}
            onToggleSubtask={editingCard ? (id) => toggleSubtask(editingCard.id, id) : undefined}
            onDeleteSubtask={editingCard ? (id) => removeSubtask(editingCard.id, id) : undefined}
            onEditSubtask={editingCard ? (id, title) => editSubtask(editingCard.id, id, title) : undefined}
            onSave={async (data) => {
              if (editingCard) {
                await undoableEditCard(editingCard.id, data);
                setEditingCard(null);
              } else {
                await gamifiedAddCard(data as Card);
                setShowAddModal(false);
              }
              setCalendarDate(null);
            }}
            onClose={() => { setShowAddModal(false); setEditingCard(null); setCalendarDate(null); }}
          />
        );
      })()}

      {/* Card detail modal */}
      {detailCard && !editingCard && (
        <DetailModal
          card={detailCard}
          categories={categories}
          columns={columns}
          epics={epics}
          onEdit={() => { setEditingCard(detailCard); setDetailCard(null); }}
          onClose={() => setDetailCard(null)}
          onDelete={async () => { await undoableRemoveCard(detailCard.id); setDetailCard(null); }}
          onMove={async (colId) => { await undoableMoveCard(detailCard.id, colId); setDetailCard({ ...detailCard, column_id: colId }); }}
          onViewEpic={(epicId) => { setSelectedEpicId(epicId); setShowEpicPanel(true); setDetailCard(null); }}
          onArchive={doneCol && detailCard.column_id === doneCol.id ? async () => { await undoableArchiveCard(detailCard.id); setDetailCard(null); } : undefined}
        />
      )}

      {/* Settings */}
      {showSettings && board && (
        <SettingsModal
          board={board}
          userId={userId}
          categories={categories}
          columns={columns}
          onAddCategory={addCategory}
          onEditCategory={editCategory}
          onRemoveCategory={removeCategory}
          onAddColumn={addColumn}
          onEditColumn={editColumn}
          onRemoveColumn={removeColumn}
          onReorderColumns={reorderColumns}
          onShowWelcome={() => setShowWelcome(true)}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Shortcuts help */}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {/* Welcome/Onboarding modal */}
      {showWelcome && (
        <WelcomeModal
          isGamified={isGamified}
          onComplete={async () => {
            if (userId) {
              try {
                await updateUserPreferences(userId, { has_seen_onboarding: true });
              } catch (err) {
                console.error('Failed to update onboarding flag:', err);
              }
            }
            setShowWelcome(false);
          }}
        />
      )}

      {/* Archive panel */}
      {showArchive && board && (
        <ArchivePanel
          boardId={board.id}
          categories={categories}
          onRestore={async (card) => { await unarchiveCard(card); }}
          onClose={() => setShowArchive(false)}
        />
      )}

      {/* Epic panel */}
      {showEpicPanel && board && (
        <EpicPanel
          boardId={board.id}
          epics={epics}
          cards={cards}
          columns={columns}
          selectedEpicId={selectedEpicId}
          onSelectEpic={setSelectedEpicId}
          onAddEpic={addEpic}
          onEditEpic={editEpic}
          onRemoveEpic={removeEpic}
          onArchiveEpic={archiveEpicCards}
          onClose={() => { setShowEpicPanel(false); setSelectedEpicId(null); }}
        />
      )}

      {/* Badge panel */}
      {isGamified && showBadgePanel && (
        <BadgePanel
          badges={gam.badges}
          level={gam.level}
          streak={gam.streak}
          levelProgress={gam.levelProgress}
          xpInCurrentLevel={gam.xpInCurrentLevel}
          xpNeededForNext={gam.xpNeededForNext}
          levelColor={gam.levelColor}
          onClose={() => setShowBadgePanel(false)}
        />
      )}

      {/* XP Toast notifications */}
      {isGamified && <XPToastStack toasts={gam.xpToasts} onDismiss={gam.dismissToast} />}

      {/* Level-up celebration */}
      {isGamified && levelUpDisplay && (
        <LevelUpCelebration
          level={levelUpDisplay.level}
          title={levelUpDisplay.title}
          color={levelUpDisplay.color}
          onComplete={() => setLevelUpDisplay(null)}
        />
      )}

      {/* Undo toast notification */}
      {activeUndoToast && (
        <UndoToast
          description={activeUndoToast.description}
          onUndo={async () => {
            await undoRedo.undo();
          }}
          onDismiss={() => setActiveUndoToast(null)}
        />
      )}
    </div>
  );
}

// ─── Detail Modal (inline) ─────────────────────────────────

function DetailModal({
  card, categories, columns, epics, onEdit, onClose, onDelete, onMove, onViewEpic, onArchive,
}: {
  card: Card;
  categories: import('@/types/database').Category[];
  columns: import('@/types/database').Column[];
  epics: import('@/types/database').Epic[];
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
  onMove: (colId: string) => void;
  onViewEpic: (epicId: string) => void;
  onArchive?: () => void;
}) {
  const cat = categories.find(c => c.id === card.category_id);
  const pri = PRIORITIES.find(p => p.id === card.priority);
  const col = columns.find(c => c.id === card.column_id);
  const epic = epics.find(e => e.id === card.epic_id);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl w-[480px] max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e]">
          <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: cat?.color || '#555' }} />
            {card.title}
          </h2>
          <button className="text-[#555568] hover:text-white text-lg px-2 py-1 rounded hover:bg-[#22222f] transition-all cursor-pointer" onClick={onClose}>&times;</button>
        </div>
        <div className="p-5 space-y-3">
          {epic && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Epic</div>
              <button
                onClick={() => onViewEpic(epic.id)}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border cursor-pointer hover:brightness-125 transition-all"
                style={{ borderColor: epic.color + '44', color: epic.color, background: epic.color + '11' }}
              >
                &#9670; {epic.name}
              </button>
            </div>
          )}
          {card.description && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Description</div>
              <div className="text-[13px] text-[#e8e8f0] leading-relaxed">{card.description}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Category</div>
              <div className="text-[13px]" style={{ color: cat?.color }}>{cat?.label || '—'}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Priority</div>
              <div className="text-[13px]" style={{ color: pri?.color }}>{pri?.label || '—'}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Effort</div>
              <div className="text-[13px] font-mono">{card.effort || '—'}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Status</div>
              <div className="text-[13px]">{col?.title || '—'}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Due Date</div>
              <div className="text-[13px]">
                {card.due_date ? (() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const due = new Date(card.due_date + 'T00:00:00');
                  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isOverdue = diffDays < 0;
                  const color = isOverdue ? '#f87171' : diffDays === 0 ? '#fbbf24' : '#e8e8f0';
                  return <span style={{ color }}>{new Date(card.due_date).toLocaleDateString()}{isOverdue ? ' (overdue)' : diffDays === 0 ? ' (today)' : ''}</span>;
                })() : '—'}
              </div>
            </div>
          </div>
          {card.notes && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Notes</div>
              <div className="text-[13px] text-[#e8e8f0] whitespace-pre-wrap leading-relaxed">{card.notes}</div>
            </div>
          )}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Move to</div>
            <div className="flex gap-1.5 flex-wrap">
              {columns.filter(c => c.id !== card.column_id).map(c => (
                <button key={c.id} onClick={() => onMove(c.id)}
                  className="px-2.5 py-1 text-xs text-[#8888a0] border border-[#2a2a3a] rounded-md hover:bg-[#1a1a26] hover:text-white transition-all cursor-pointer">
                  {c.title}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#1e1e2e]">
          <div className="flex gap-2">
            <button onClick={onDelete} className="text-xs text-[#f87171] hover:bg-[#f8717110] px-3 py-1.5 rounded-md transition-all cursor-pointer">Delete</button>
            {onArchive && (
              <button onClick={onArchive} className="text-xs text-[#a855f7] hover:bg-[#a855f710] px-3 py-1.5 rounded-md transition-all cursor-pointer">Archive</button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-xs text-[#8888a0] border border-[#2a2a3a] px-3 py-1.5 rounded-md hover:bg-[#1a1a26] transition-all cursor-pointer">Close</button>
            <button onClick={onEdit} className="text-xs text-white bg-[#4a9eff] px-3 py-1.5 rounded-md hover:brightness-110 transition-all cursor-pointer">Edit</button>
          </div>
        </div>
      </div>
    </div>
  );
}
