'use client';

import { useState } from 'react';
import type { Epic, Card, Column } from '@/types/database';
import { EPIC_STATUSES, PRESET_COLORS } from '@/types/database';

interface EpicPanelProps {
  boardId: string;
  epics: Epic[];
  cards: Card[];
  columns: Column[];
  selectedEpicId: string | null;
  onSelectEpic: (id: string | null) => void;
  onAddEpic: (epic: Omit<Epic, 'id' | 'created_at' | 'updated_at'>) => Promise<Epic>;
  onEditEpic: (id: string, updates: Partial<Omit<Epic, 'id' | 'board_id' | 'created_at'>>) => Promise<void>;
  onRemoveEpic: (id: string) => Promise<void>;
  onClose: () => void;
}

export function EpicPanel({
  boardId, epics, cards, columns, selectedEpicId, onSelectEpic,
  onAddEpic, onEditEpic, onRemoveEpic, onClose,
}: EpicPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const selectedEpic = epics.find(e => e.id === selectedEpicId);

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-end z-[1000] backdrop-blur-sm" onClick={onClose}>
      <div className="w-[560px] max-w-full h-full bg-[#0a0a0f] border-l border-[#2a2a3a] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e] sticky top-0 bg-[#0a0a0f] z-10">
          <h2 className="text-[15px] font-semibold text-white">
            {selectedEpic ? (
              <button onClick={() => onSelectEpic(null)} className="text-[#555568] hover:text-white mr-2 cursor-pointer">&larr;</button>
            ) : null}
            {selectedEpic ? selectedEpic.name : 'Epics'}
          </h2>
          <div className="flex items-center gap-2">
            {!selectedEpic && (
              <button onClick={() => setShowCreate(true)}
                className="h-7 px-3 text-xs text-[#4a9eff] border border-[#4a9eff44] rounded-md hover:bg-[#4a9eff11] transition-all cursor-pointer">
                + New Epic
              </button>
            )}
            <button onClick={onClose} className="text-[#555568] hover:text-white text-lg px-2 py-1 rounded hover:bg-[#22222f] transition-all cursor-pointer">&times;</button>
          </div>
        </div>

        {/* Epic detail view */}
        {selectedEpic && (
          <EpicDetail
            epic={selectedEpic}
            cards={cards.filter(c => c.epic_id === selectedEpic.id)}
            columns={columns}
            onEdit={(updates) => onEditEpic(selectedEpic.id, updates)}
            onDelete={async () => { await onRemoveEpic(selectedEpic.id); onSelectEpic(null); }}
          />
        )}

        {/* Epic list */}
        {!selectedEpic && (
          <div className="p-5 space-y-2">
            {epics.length === 0 && !showCreate && (
              <div className="text-center py-12 text-[#555568] text-sm">
                No epics yet. Create one to group related stories together.
              </div>
            )}
            {epics.map(epic => {
              const epicCards = cards.filter(c => c.epic_id === epic.id);
              const sortedCols = [...columns].sort((a, b) => a.position - b.position);
              const doneCol = sortedCols.length > 0 ? sortedCols[sortedCols.length - 1] : undefined;
              const doneCount = doneCol ? epicCards.filter(c => c.column_id === doneCol.id).length : 0;
              const progress = epicCards.length > 0 ? Math.round((doneCount / epicCards.length) * 100) : 0;
              const status = EPIC_STATUSES.find(s => s.id === epic.status);

              if (editingId === epic.id) {
                return (
                  <EpicForm
                    key={epic.id}
                    initial={epic}
                    onSave={async (data) => { await onEditEpic(epic.id, data); setEditingId(null); }}
                    onCancel={() => setEditingId(null)}
                  />
                );
              }

              return (
                <div key={epic.id}
                  className="bg-[#12121a] border border-[#1e1e2e] rounded-lg p-4 hover:border-[#2a2a3a] transition-all cursor-pointer"
                  onClick={() => onSelectEpic(epic.id)}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: epic.color }}>&#9670;</span>
                      <span className="text-[13px] font-medium text-[#e8e8f0]">{epic.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase" style={{ color: status?.color, background: status?.color + '18' }}>
                        {status?.label}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(epic.id); }}
                        className="text-[#555568] hover:text-white text-xs px-1 rounded hover:bg-[#22222f] transition-all cursor-pointer"
                      >&#9998;</button>
                    </div>
                  </div>
                  {epic.description && (
                    <p className="text-xs text-[#555568] leading-relaxed mb-3 line-clamp-2">
                      {epic.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[#1a1a26] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: epic.color }} />
                    </div>
                    <span className="text-[10px] font-mono text-[#555568]">{doneCount}/{epicCards.length}</span>
                  </div>
                </div>
              );
            })}
            {showCreate && (
              <EpicForm
                onSave={async (data) => { await onAddEpic({ ...data, board_id: boardId } as Epic); setShowCreate(false); }}
                onCancel={() => setShowCreate(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Epic Detail ───────────────────────────────────────────

function EpicDetail({
  epic, cards, columns, onEdit, onDelete,
}: {
  epic: Epic; cards: Card[]; columns: Column[];
  onEdit: (updates: Partial<Epic>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const sortedCols = [...columns].sort((a, b) => a.position - b.position);
  const doneCol = sortedCols.length > 0 ? sortedCols[sortedCols.length - 1] : undefined;
  const doneCount = doneCol ? cards.filter(c => c.column_id === doneCol.id).length : 0;
  const progress = cards.length > 0 ? Math.round((doneCount / cards.length) * 100) : 0;
  const status = EPIC_STATUSES.find(s => s.id === epic.status);

  if (editing) {
    return (
      <div className="p-5">
        <EpicForm
          initial={epic}
          onSave={async (data) => { await onEdit(data); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5">
      {/* Status + progress */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: status?.color, background: status?.color + '18' }}>
          {status?.label}
        </span>
        <div className="flex-1 h-2 bg-[#1a1a26] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: epic.color }} />
        </div>
        <span className="text-xs font-mono text-[#555568]">{progress}%</span>
      </div>

      {/* Description */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-2">Description</div>
        <div className="text-[13px] text-[#e8e8f0] leading-relaxed whitespace-pre-wrap">
          {epic.description || 'No description yet.'}
        </div>
      </div>

      {epic.target_date && (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Target Date</div>
          <div className="text-[13px] text-[#e8e8f0]">{new Date(epic.target_date).toLocaleDateString()}</div>
        </div>
      )}

      {/* Stories list */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-2">
          Stories ({cards.length})
        </div>
        {cards.length === 0 ? (
          <div className="text-xs text-[#555568] py-4 text-center">No stories linked to this epic yet.</div>
        ) : (
          <div className="space-y-1">
            {cards.map(card => {
              const col = columns.find(c => c.id === card.column_id);
              return (
                <div key={card.id} className="flex items-center justify-between px-3 py-2 bg-[#12121a] rounded-lg border border-[#1e1e2e]">
                  <span className="text-xs text-[#e8e8f0]">{card.title}</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: col?.color, background: col?.color + '18' }}>
                    {col?.title}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1e1e2e]">
        <button onClick={onDelete} className="text-xs text-[#f87171] hover:bg-[#f8717110] px-3 py-1.5 rounded-md transition-all cursor-pointer">Delete Epic</button>
        <button onClick={() => setEditing(true)} className="text-xs text-white bg-[#4a9eff] px-3 py-1.5 rounded-md hover:brightness-110 transition-all cursor-pointer">Edit</button>
      </div>
    </div>
  );
}

// ─── Epic Form ─────────────────────────────────────────────

function EpicForm({
  initial, onSave, onCancel,
}: {
  initial?: Epic;
  onSave: (data: Partial<Epic>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [color, setColor] = useState(initial?.color || PRESET_COLORS[0]);
  const [status, setStatus] = useState<Epic['status']>(initial?.status || 'planning');
  const [targetDate, setTargetDate] = useState(initial?.target_date || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      description: description.trim() || null,
      color,
      status: status as Epic['status'],
      target_date: targetDate || null,
    });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#12121a] border border-[#2a2a3a] rounded-lg p-4 space-y-3">
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Epic Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Portfolio Redesign"
          className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] transition-colors" autoFocus />
      </div>
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
          placeholder="Full project description — goals, scope, acceptance criteria, anything that helps define what 'done' looks like..."
          className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] transition-colors resize-y min-h-[100px]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as Epic['status'])}
            className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] cursor-pointer">
            {EPIC_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Target Date</label>
          <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] cursor-pointer" />
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Color</label>
        <div className="flex gap-1.5 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-md cursor-pointer transition-all ${color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-[#12121a]' : 'hover:scale-110'}`}
              style={{ background: c }} />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="text-xs text-[#8888a0] border border-[#2a2a3a] px-3 py-1.5 rounded-md hover:bg-[#1a1a26] transition-all cursor-pointer">Cancel</button>
        <button type="submit" disabled={saving} className="text-xs text-white bg-[#4a9eff] px-3 py-1.5 rounded-md hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer">
          {saving ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
