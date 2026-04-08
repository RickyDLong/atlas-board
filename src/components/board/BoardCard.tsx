'use client';

import { useState } from 'react';
import type { Card, Category } from '@/types/database';

interface BoardCardProps {
  card: Card;
  category?: Category;
  priority?: { id: string; label: string; color: string };
  isDoneColumn?: boolean;
  onClick: () => void;
  onMenu: (x: number, y: number) => void;
}

/**
 * Compute the shield aging tier for a card based on days in current column.
 * Returns { count, color, label } or null if shields shouldn't render.
 */
export function getShieldAging(card: Card, isDoneColumn: boolean): { count: number; color: string; label: string } | null {
  if (isDoneColumn) return null;

  const now = new Date();
  const ref = card.column_changed_at ? new Date(card.column_changed_at) : new Date(card.updated_at);
  const days = Math.floor((now.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));

  if (days <= 2) return { count: 1, color: '#34d399', label: days === 0 ? 'Today' : days === 1 ? '1 day in column' : '2 days in column' };
  if (days <= 4) return { count: 2, color: '#fbbf24', label: `${days} days in column` };
  if (days <= 7) return { count: 3, color: '#fb923c', label: `${days} days in column` };
  return { count: 4, color: '#f87171', label: `${days} days in column` };
}

export function BoardCard({ card, category, priority, isDoneColumn = false, onClick, onMenu }: BoardCardProps) {
  const [dragging, setDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
  };

  const aging = getShieldAging(card, isDoneColumn);

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
        <span className="text-[13px] font-medium leading-snug text-[#e8e8f0] flex-1 min-w-0">
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

      <div className="flex items-center justify-between flex-wrap">
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
          {card.due_date && (() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const due = new Date(card.due_date + 'T00:00:00');
            const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const isOverdue = diffDays < 0;
            const isDueToday = diffDays === 0;
            const isDueSoon = diffDays > 0 && diffDays <= 2;
            const color = isOverdue ? '#f87171' : isDueToday ? '#fbbf24' : isDueSoon ? '#fb923c' : '#555568';
            const label = isOverdue ? `${Math.abs(diffDays)}d overdue` : isDueToday ? 'Due today' : `${diffDays}d`;
            return (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded font-mono"
                style={{ color, background: color + '18' }}
              >
                {label}
              </span>
            );
          })()}
        </div>

        {/* Shield aging indicator */}
        {aging && (
          <div className="flex items-center gap-0.5" title={aging.label} data-testid="shield-aging">
            {Array.from({ length: aging.count }).map((_, i) => (
              <svg
                key={i}
                width="11"
                height="13"
                viewBox="0 0 24 28"
                fill={aging.color}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0L0 5v8c0 8.4 5.1 13.2 12 15 6.9-1.8 12-6.6 12-15V5L12 0z" />
              </svg>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
