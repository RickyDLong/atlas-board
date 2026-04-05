'use client';

import { useBoard } from '@/hooks/useBoard';
import { BoardColumn } from '@/components/board/BoardColumn';
import { CardModal } from '@/components/board/CardModal';
import { EpicPanel } from '@/components/board/EpicPanel';
import { SettingsModal } from '@/components/board/SettingsModal';
import { PRIORITIES } from '@/types/database';
import type { Card } from '@/types/database';
import { signOut } from '@/lib/board-actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function DashboardPage() {
  const {
    board, columns, categories, cards, epics, loading, error,
    addCard, editCard, removeCard, moveCardToColumn,
    addEpic, editEpic, removeEpic,
    addColumn, editColumn, removeColumn, reorderColumns,
    addCategory, editCategory, removeCategory,
    refresh,
  } = useBoard();

  const router = useRouter();
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
          <button onClick={refresh} className="text-[#4a9eff] text-sm hover:underline">Retry</button>
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

  const getColumnCards = (colId: string) => filteredCards.filter(c => c.column_id === colId);

  const totalActive = cards.filter(c => {
    const doneCol = columns.find(col => col.title.toLowerCase() === 'done');
    return !doneCol || c.column_id !== doneCol.id;
  }).length;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e2e] bg-[#12121a] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Image
            src="/atlas-board-logo.png"
            alt="Atlas Board"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <h1 className="text-lg font-semibold text-white tracking-tight">
            Atlas Board <span className="text-[#555568] font-normal ml-2 text-sm">{board?.name}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-[#1a1a26] border border-[#2a2a3a] rounded-lg px-3 py-1.5 text-[#e8e8f0] text-xs w-48 outline-none focus:border-[#4a9eff] transition-colors"
          />
          <button
            onClick={() => setShowEpicPanel(true)}
            className="h-8 px-3 bg-transparent border border-[#2a2a3a] text-[#8888a0] rounded-lg text-xs font-medium hover:bg-[#1a1a26] hover:text-white transition-all cursor-pointer"
          >
            Epics
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 bg-transparent border border-[#2a2a3a] text-[#8888a0] rounded-lg flex items-center justify-center text-sm hover:bg-[#1a1a26] hover:text-white transition-all cursor-pointer"
            title="Settings"
          >
            &#9881;
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

      {/* Board */}
      <div className="flex gap-px min-h-[calc(100vh-140px)] bg-[#1e1e2e]">
        {columns.map(col => (
          <BoardColumn
            key={col.id}
            column={col}
            cards={getColumnCards(col.id)}
            categories={categories}
            columns={columns}
            onAddCard={(colId) => { setAddToColumnId(colId); setShowAddModal(true); }}
            onCardClick={(card) => setDetailCard(card)}
            onCardMenu={(card, x, y) => setContextMenu({ card, x, y })}
            onDrop={(colId, cardId) => moveCardToColumn(cardId, colId)}
          />
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg p-1 min-w-[160px] shadow-xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button className="block w-full text-left px-3 py-1.5 text-xs text-[#8888a0] rounded hover:bg-[#22222f] hover:text-white transition-all"
              onClick={() => { setEditingCard(contextMenu.card); setContextMenu(null); }}>Edit</button>
            {columns.filter(c => c.id !== contextMenu.card.column_id).map(col => (
              <button key={col.id} className="block w-full text-left px-3 py-1.5 text-xs text-[#8888a0] rounded hover:bg-[#22222f] hover:text-white transition-all"
                onClick={() => { moveCardToColumn(contextMenu.card.id, col.id); setContextMenu(null); }}>
                Move to {col.title}
              </button>
            ))}
            <button className="block w-full text-left px-3 py-1.5 text-xs text-[#f87171] rounded hover:bg-[#f8717110] transition-all"
              onClick={() => { removeCard(contextMenu.card.id); setContextMenu(null); }}>Delete</button>
          </div>
        </>
      )}

      {/* Card create/edit modal */}
      {(showAddModal || editingCard) && board && (
        <CardModal
          card={editingCard}
          boardId={board.id}
          defaultColumnId={addToColumnId || columns[0]?.id}
          categories={categories}
          columns={columns}
          epics={epics}
          onSave={async (data) => {
            if (editingCard) {
              await editCard(editingCard.id, data);
              setEditingCard(null);
            } else {
              await addCard(data as Card);
              setShowAddModal(false);
            }
          }}
          onClose={() => { setShowAddModal(false); setEditingCard(null); }}
        />
      )}

      {/* Card detail modal */}
      {detailCard && !editingCard && (
        <DetailModal
          card={detailCard}
          categories={categories}
          columns={columns}
          epics={epics}
          onEdit={() => { setEditingCard(detailCard); setDetailCard(null); }}
          onClose={() => setDetailCard(null)}
          onDelete={async () => { await removeCard(detailCard.id); setDetailCard(null); }}
          onMove={async (colId) => { await moveCardToColumn(detailCard.id, colId); setDetailCard({ ...detailCard, column_id: colId }); }}
          onViewEpic={(epicId) => { setSelectedEpicId(epicId); setShowEpicPanel(true); setDetailCard(null); }}
        />
      )}

      {/* Settings */}
      {showSettings && board && (
        <SettingsModal
          board={board}
          categories={categories}
          columns={columns}
          onAddCategory={addCategory}
          onEditCategory={editCategory}
          onRemoveCategory={removeCategory}
          onAddColumn={addColumn}
          onEditColumn={editColumn}
          onRemoveColumn={removeColumn}
          onReorderColumns={reorderColumns}
          onClose={() => setShowSettings(false)}
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
          onClose={() => { setShowEpicPanel(false); setSelectedEpicId(null); }}
        />
      )}
    </div>
  );
}

// ─── Detail Modal (inline) ─────────────────────────────────

function DetailModal({
  card, categories, columns, epics, onEdit, onClose, onDelete, onMove, onViewEpic,
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
          <button onClick={onDelete} className="text-xs text-[#f87171] hover:bg-[#f8717110] px-3 py-1.5 rounded-md transition-all cursor-pointer">Delete</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-xs text-[#8888a0] border border-[#2a2a3a] px-3 py-1.5 rounded-md hover:bg-[#1a1a26] transition-all cursor-pointer">Close</button>
            <button onClick={onEdit} className="text-xs text-white bg-[#4a9eff] px-3 py-1.5 rounded-md hover:brightness-110 transition-all cursor-pointer">Edit</button>
          </div>
        </div>
      </div>
    </div>
  );
}
