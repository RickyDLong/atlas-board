'use client';

import { useState } from 'react';
import type { Board, Category, Column } from '@/types/database';
import { PRESET_COLORS } from '@/types/database';

interface SettingsModalProps {
  board: Board;
  categories: Category[];
  columns: Column[];
  onAddCategory: (label: string, color: string) => Promise<void>;
  onEditCategory: (id: string, updates: Partial<Pick<Category, 'label' | 'color' | 'position'>>) => Promise<void>;
  onRemoveCategory: (id: string) => Promise<void>;
  onAddColumn: (title: string, color: string) => Promise<void>;
  onEditColumn: (id: string, updates: Partial<Pick<Column, 'title' | 'color' | 'position'>>) => Promise<void>;
  onRemoveColumn: (id: string) => Promise<void>;
  onReorderColumns: (cols: Column[]) => Promise<void>;
  onClose: () => void;
}

export function SettingsModal({
  categories, columns,
  onAddCategory, onEditCategory, onRemoveCategory,
  onAddColumn, onEditColumn, onRemoveColumn, onReorderColumns,
  onClose,
}: SettingsModalProps) {
  const [tab, setTab] = useState<'categories' | 'columns'>('categories');

  const moveColumn = (idx: number, dir: number) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= columns.length) return;
    const copy = [...columns];
    [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
    onReorderColumns(copy);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl w-[520px] max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e]">
          <h2 className="text-[15px] font-semibold text-white">Board Settings</h2>
          <button onClick={onClose} className="text-[#555568] hover:text-white text-lg px-2 py-1 rounded hover:bg-[#22222f] transition-all cursor-pointer">&times;</button>
        </div>

        <div className="flex border-b border-[#1e1e2e]">
          <button
            onClick={() => setTab('categories')}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${tab === 'categories' ? 'text-[#4a9eff] border-[#4a9eff]' : 'text-[#555568] border-transparent hover:text-[#8888a0]'}`}
          >Categories</button>
          <button
            onClick={() => setTab('columns')}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${tab === 'columns' ? 'text-[#4a9eff] border-[#4a9eff]' : 'text-[#555568] border-transparent hover:text-[#8888a0]'}`}
          >Columns</button>
        </div>

        <div className="p-5 space-y-2">
          {tab === 'categories' && (
            <>
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-2.5 px-3 py-2.5 bg-[#1a1a26] border border-[#1e1e2e] rounded-lg">
                  <div className="w-7 h-7 rounded-md flex-shrink-0 relative overflow-hidden cursor-pointer" style={{ background: cat.color }}>
                    <input type="color" value={cat.color}
                      onChange={e => onEditCategory(cat.id, { color: e.target.value })}
                      className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] border-none cursor-pointer opacity-0" />
                  </div>
                  <input
                    value={cat.label}
                    onChange={e => onEditCategory(cat.id, { label: e.target.value })}
                    className="flex-1 bg-transparent border-none text-[#e8e8f0] text-[13px] outline-none"
                    placeholder="Category name..."
                  />
                  <button onClick={() => onRemoveCategory(cat.id)}
                    className="text-[#555568] hover:text-[#f87171] text-sm px-1 rounded transition-all cursor-pointer">&times;</button>
                </div>
              ))}
              <button onClick={() => onAddCategory('New Category', PRESET_COLORS[categories.length % PRESET_COLORS.length])}
                className="w-full py-2.5 border border-dashed border-[#2a2a3a] rounded-lg text-[#555568] text-xs hover:border-[#4a9eff] hover:text-[#4a9eff] transition-all cursor-pointer">
                + Add Category
              </button>
            </>
          )}

          {tab === 'columns' && (
            <>
              {columns.map((col, idx) => (
                <div key={col.id} className="flex items-center gap-2.5 px-3 py-2.5 bg-[#1a1a26] border border-[#1e1e2e] rounded-lg">
                  <div className="w-7 h-7 rounded-md flex-shrink-0 relative overflow-hidden cursor-pointer" style={{ background: col.color }}>
                    <input type="color" value={col.color}
                      onChange={e => onEditColumn(col.id, { color: e.target.value })}
                      className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] border-none cursor-pointer opacity-0" />
                  </div>
                  <input
                    value={col.title}
                    onChange={e => onEditColumn(col.id, { title: e.target.value })}
                    className="flex-1 bg-transparent border-none text-[#e8e8f0] text-[13px] outline-none"
                    placeholder="Column name..."
                  />
                  <button onClick={() => moveColumn(idx, -1)} className="text-[#555568] hover:text-white text-sm px-1 rounded transition-all cursor-pointer">&larr;</button>
                  <button onClick={() => moveColumn(idx, 1)} className="text-[#555568] hover:text-white text-sm px-1 rounded transition-all cursor-pointer">&rarr;</button>
                  <button onClick={() => onRemoveColumn(col.id)} className="text-[#555568] hover:text-[#f87171] text-sm px-1 rounded transition-all cursor-pointer">&times;</button>
                </div>
              ))}
              <button onClick={() => onAddColumn('New Column', PRESET_COLORS[(columns.length + 4) % PRESET_COLORS.length])}
                className="w-full py-2.5 border border-dashed border-[#2a2a3a] rounded-lg text-[#555568] text-xs hover:border-[#4a9eff] hover:text-[#4a9eff] transition-all cursor-pointer">
                + Add Column
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
