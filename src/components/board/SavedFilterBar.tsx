'use client';

import { useState } from 'react';
import type { SavedFilter } from '@/types/database';

interface FilterState {
  categoryIds: string[];
  priority: string | null;
  epicId: string | null;
}

interface SavedFilterBarProps {
  savedFilters: SavedFilter[];
  currentFilter: FilterState;
  onApplyFilter: (filter: FilterState) => void;
  onSaveFilter: (name: string, filter: FilterState) => Promise<void>;
  onDeleteFilter: (id: string) => Promise<void>;
}

export function SavedFilterBar({
  savedFilters,
  currentFilter,
  onApplyFilter,
  onSaveFilter,
  onDeleteFilter,
}: SavedFilterBarProps) {
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [saving, setSaving] = useState(false);

  const hasActiveFilters = currentFilter.categoryIds.length > 0 || currentFilter.priority || currentFilter.epicId;

  const handleSave = async () => {
    if (!filterName.trim() || !hasActiveFilters) return;
    setSaving(true);
    try {
      await onSaveFilter(filterName.trim(), currentFilter);
      setFilterName('');
      setShowSaveInput(false);
    } finally {
      setSaving(false);
    }
  };

  const handleApply = (filter: SavedFilter) => {
    onApplyFilter({
      categoryIds: filter.filters.categoryIds || [],
      priority: filter.filters.priorities?.[0] || null,
      epicId: filter.filters.epicIds?.[0] || null,
    });
  };

  if (savedFilters.length === 0 && !hasActiveFilters) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {savedFilters.map(sf => (
        <div key={sf.id} className="flex items-center group">
          <button
            onClick={() => handleApply(sf)}
            className="px-2.5 py-1 rounded-l-md text-[11px] font-medium border border-[#2a2a3a] bg-[#1a1a26] text-[#8888a0] hover:text-[#4a9eff] hover:border-[#4a9eff] transition-all cursor-pointer"
          >
            {sf.name}
          </button>
          <button
            onClick={() => onDeleteFilter(sf.id)}
            className="px-1.5 py-1 rounded-r-md text-[11px] border border-l-0 border-[#2a2a3a] bg-[#1a1a26] text-[#555568] hover:text-[#f87171] hover:border-[#f87171] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
          >
            &times;
          </button>
        </div>
      ))}

      {hasActiveFilters && !showSaveInput && (
        <button
          onClick={() => setShowSaveInput(true)}
          className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-dashed border-[#2a2a3a] text-[#555568] hover:text-[#4a9eff] hover:border-[#4a9eff] transition-all cursor-pointer"
        >
          Save filter
        </button>
      )}

      {showSaveInput && (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            value={filterName}
            onChange={e => setFilterName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') { setShowSaveInput(false); setFilterName(''); }
            }}
            className="w-28 px-2 py-1 bg-[#0a0a0f] border border-[#2a2a3a] text-[#e8e8f0] text-[11px] rounded outline-none focus:border-[#4a9eff] placeholder:text-[#555568]"
            placeholder="Filter name..."
          />
          <button
            onClick={handleSave}
            disabled={saving || !filterName.trim()}
            className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#4a9eff] text-white hover:bg-[#3b8be0] transition-all cursor-pointer disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => { setShowSaveInput(false); setFilterName(''); }}
            className="px-1.5 py-1 rounded-md text-[11px] text-[#555568] hover:text-[#8888a0] transition-all cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
