'use client';

import { useState, useMemo } from 'react';
import type { Card, Category, Column, Epic } from '@/types/database';
import { PRIORITIES } from '@/types/database';

interface ListViewProps {
  cards: Card[];
  categories: Category[];
  columns: Column[];
  epics: Epic[];
  onCardClick: (card: Card) => void;
}

type SortField = 'title' | 'status' | 'category' | 'priority' | 'effort' | 'epic' | 'due_date' | 'updated_at';
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const EFFORT_ORDER: Record<string, number> = { XL: 0, L: 1, M: 2, S: 3, XS: 4 };

function SortHeader({ field, label, width, sortField, sortDir, onToggle }: {
  field: SortField; label: string; width: string;
  sortField: SortField; sortDir: SortDir; onToggle: (field: SortField) => void;
}) {
  const active = sortField === field;
  return (
    <th
      className={`text-left text-[10px] font-semibold uppercase tracking-wider px-3 py-2.5 cursor-pointer select-none transition-colors hover:text-[#e8e8f0] ${width} ${active ? 'text-[#4a9eff]' : 'text-[#555568]'}`}
      onClick={() => onToggle(field)}
    >
      {label}
      {active && (
        <span className="ml-1 text-[8px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
      )}
    </th>
  );
}

export function ListView({ cards, categories, columns, epics, onCardClick }: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const colMap = useMemo(() => Object.fromEntries(columns.map(c => [c.id, c])), [columns]);
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories]);
  const epicMap = useMemo(() => Object.fromEntries(epics.map(e => [e.id, e])), [epics]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedCards = useMemo(() => {
    const arr = [...cards];
    const dir = sortDir === 'asc' ? 1 : -1;

    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'status': {
          const aPos = colMap[a.column_id]?.position ?? 99;
          const bPos = colMap[b.column_id]?.position ?? 99;
          cmp = aPos - bPos;
          break;
        }
        case 'category': {
          const aCat = catMap[a.category_id || '']?.label || 'zzz';
          const bCat = catMap[b.category_id || '']?.label || 'zzz';
          cmp = aCat.localeCompare(bCat);
          break;
        }
        case 'priority':
          cmp = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
          break;
        case 'effort':
          cmp = (EFFORT_ORDER[a.effort || ''] ?? 99) - (EFFORT_ORDER[b.effort || ''] ?? 99);
          break;
        case 'epic': {
          const aEpic = epicMap[a.epic_id || '']?.name || 'zzz';
          const bEpic = epicMap[b.epic_id || '']?.name || 'zzz';
          cmp = aEpic.localeCompare(bEpic);
          break;
        }
        case 'due_date': {
          const aDate = a.due_date || '9999-12-31';
          const bDate = b.due_date || '9999-12-31';
          cmp = aDate.localeCompare(bDate);
          break;
        }
        case 'updated_at':
          cmp = b.updated_at.localeCompare(a.updated_at); // newest first by default
          break;
      }
      return cmp * dir;
    });

    return arr;
  }, [cards, sortField, sortDir, colMap, catMap, epicMap]);

  const doneColId = columns.find(c => c.is_done)?.id || '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const sortProps = { sortField, sortDir, onToggle: toggleSort };

  return (
    <div className="flex-1 overflow-auto p-4">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-[#0a0a0f] z-10">
          <tr className="border-b border-[#1e1e2e]">
            <SortHeader field="title" label="Title" width="min-w-[200px]" {...sortProps} />
            <SortHeader field="status" label="Status" width="w-28" {...sortProps} />
            <SortHeader field="category" label="Category" width="w-28" {...sortProps} />
            <SortHeader field="priority" label="Priority" width="w-24" {...sortProps} />
            <SortHeader field="effort" label="Effort" width="w-16" {...sortProps} />
            <SortHeader field="epic" label="Epic" width="w-32" {...sortProps} />
            <SortHeader field="due_date" label="Due" width="w-24" {...sortProps} />
            <SortHeader field="updated_at" label="Updated" width="w-24" {...sortProps} />
          </tr>
        </thead>
        <tbody>
          {sortedCards.map(card => {
            const col = colMap[card.column_id];
            const cat = catMap[card.category_id || ''];
            const pri = PRIORITIES.find(p => p.id === card.priority);
            const epic = epicMap[card.epic_id || ''];
            const isDone = card.column_id === doneColId;
            const isOverdue = card.due_date && card.due_date < todayStr && !isDone;

            return (
              <tr
                key={card.id}
                onClick={() => onCardClick(card)}
                className={`border-b border-[#1e1e2e] cursor-pointer transition-colors hover:bg-[#12121a] ${isDone ? 'opacity-50' : ''}`}
              >
                <td className="px-3 py-2.5">
                  <span className={`text-[13px] text-[#e8e8f0] ${isDone ? 'line-through' : ''}`}>
                    {card.title}
                  </span>
                  {card.description && (
                    <span className="text-[11px] text-[#3a3a4a] ml-2 truncate">
                      {card.description.length > 50 ? card.description.slice(0, 50) + '...' : card.description}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: (col?.color || '#555') + '22', color: col?.color || '#555' }}
                  >
                    {col?.title || '—'}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  {cat ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                      <span className="text-[11px]" style={{ color: cat.color }}>{cat.label}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#3a3a4a]">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-[11px] font-medium" style={{ color: pri?.color || '#555' }}>
                    {pri?.label || '—'}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-[11px] font-mono text-[#8888a0]">{card.effort || '—'}</span>
                </td>
                <td className="px-3 py-2.5">
                  {epic ? (
                    <span className="text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-sm" style={{ background: epic.color }} />
                      <span style={{ color: epic.color }}>{epic.name}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#3a3a4a]">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {card.due_date ? (
                    <span className={`text-[11px] font-mono ${isOverdue ? 'text-[#f87171] font-semibold' : 'text-[#8888a0]'}`}>
                      {new Date(card.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#3a3a4a]">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-[11px] text-[#555568] font-mono">
                    {(() => {
                      const d = new Date(card.updated_at);
                      const days = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
                      if (days === 0) return 'Today';
                      if (days === 1) return '1d ago';
                      return `${days}d ago`;
                    })()}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sortedCards.length === 0 && (
        <div className="text-center py-12 text-[#3a3a4a] text-sm">No cards match your filters</div>
      )}
    </div>
  );
}
