'use client';

import { useState } from 'react';
import type { Card, Category } from '@/types/database';

interface BoardCardProps {
  card: Card;
  category?: Category;
  priority?: { id: string; label: string; color: string };
  onClick: () => void;
  onMenu: (x: number, y: number) => void;
}

export function BoardCard({ card, category, priority, onClick, onMenu }: BoardCardProps) {
  const [dragging, setDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
  };

  return (
    <div
      className={`bg-[#12121a] border border-[#1e1e2e] rounded-lg p-3 mb-1.5 cursor-grab relative transition-all hover:border-[#2a2a3a] hover:bg-[#1a1a26] ${dragging ? 'opacity-50 rotate-1' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setDragging(false)}
      onClick={onClick}
    >
      {/* Category color line */}
      <div
        className="absolute top-0 left-3 right-3 h-0.5 rounded-b-sm"
        style={{ background: category?.color || '#555' }}
      />

      <div className="flex items-start justify-between mb-1.5 pt-1">
        <span className="text-[13px] font-medium leading-snug text-[#e8e8f0] flex-1">
          {card.title}
        </span>
        <button
          className="opacity-0 group-hover:opacity-100 bg-transparent border-none text-[#555568] cursor-pointer px-1 py-0.5 text-sm rounded hover:bg-[#22222f] hover:text-[#8888a0] transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            onMenu(rect.right, rect.bottom + 4);
          }}
          style={{ opacity: undefined }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
        >
          &#8942;
        </button>
      </div>

      {card.description && (
        <p className="text-xs text-[#555568] leading-relaxed mb-2">
          {card.description.length > 80 ? card.description.slice(0, 80) + '...' : card.description}
        </p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        {category && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide"
            style={{ background: category.color + '22', color: category.color }}
          >
            {category.label}
          </span>
        )}
        {priority && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide border"
            style={{ borderColor: priority.color + '66', color: priority.color, background: 'transparent' }}
          >
            {priority.label}
          </span>
        )}
        {card.effort && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase font-mono text-[#555568] bg-[#1a1a26]">
            {card.effort}
          </span>
        )}
      </div>
    </div>
  );
}
