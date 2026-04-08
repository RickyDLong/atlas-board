'use client';

import { useState } from 'react';
import type { Label } from '@/types/database';
import { PRESET_COLORS } from '@/types/database';

interface LabelPickerProps {
  labels: Label[];
  selectedLabelIds: string[];
  onToggle: (labelId: string) => void;
  onCreateLabel: (name: string, color: string) => Promise<Label | undefined>;
}

export function LabelPicker({ labels, selectedLabelIds, onToggle, onCreateLabel }: LabelPickerProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const label = await onCreateLabel(newName.trim(), newColor);
    if (label) {
      onToggle(label.id);
    }
    setNewName('');
    setShowCreate(false);
    setCreating(false);
  };

  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Labels</label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {labels.map(lbl => {
          const selected = selectedLabelIds.includes(lbl.id);
          return (
            <button
              key={lbl.id}
              type="button"
              onClick={() => onToggle(lbl.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                selected ? 'bg-opacity-20' : 'bg-transparent opacity-60 hover:opacity-100'
              }`}
              style={{
                borderColor: lbl.color,
                color: lbl.color,
                background: selected ? `${lbl.color}20` : 'transparent',
              }}
            >
              {lbl.name} {selected && '✓'}
            </button>
          );
        })}
        {!showCreate && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-2 py-1 rounded-md text-[11px] border border-dashed border-[#2a2a3a] text-[#555568] hover:text-[#4a9eff] hover:border-[#4a9eff] transition-all cursor-pointer"
          >
            + New
          </button>
        )}
      </div>
      {showCreate && (
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-6 h-6 rounded flex-shrink-0 relative overflow-hidden cursor-pointer" style={{ background: newColor }}>
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
              className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] border-none cursor-pointer opacity-0" />
          </div>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); handleCreate(); }
              if (e.key === 'Escape') setShowCreate(false);
            }}
            placeholder="Label name..."
            className="flex-1 px-2 py-1 bg-[#0a0a0f] border border-[#2a2a3a] text-[#e8e8f0] text-[11px] rounded outline-none focus:border-[#4a9eff] placeholder:text-[#555568]"
          />
          <button type="button" onClick={handleCreate} disabled={creating || !newName.trim()}
            className="px-2 py-1 rounded text-[11px] font-medium bg-[#4a9eff] text-white hover:bg-[#3b8be0] transition-all cursor-pointer disabled:opacity-50">
            Add
          </button>
          <button type="button" onClick={() => setShowCreate(false)}
            className="px-1 py-1 text-[11px] text-[#555568] hover:text-[#8888a0] cursor-pointer">
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
