'use client';

import type { Column, Card, Category, Subtask } from '@/types/database';
import { PRIORITIES } from '@/types/database';
import { BoardCard } from './BoardCard';

interface BoardColumnProps {
  column: Column;
  cards: Card[];
  categories: Category[];
  columns: Column[];
  subtasks?: Record<string, Subtask[]>;
  onAddCard: (columnId: string) => void;
  onCardClick: (card: Card) => void;
  onCardMenu: (card: Card, x: number, y: number) => void;
  onDrop: (columnId: string, cardId: string) => void;
}

export function BoardColumn({
  column, cards, categories, columns, subtasks = {}, onAddCard, onCardClick, onCardMenu, onDrop,
}: BoardColumnProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) onDrop(column.id, cardId);
  };

  return (
    <div
      className="flex-1 min-w-[240px] bg-[#0a0a0f] flex flex-col"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="px-4 pt-4 pb-3 flex items-center justify-between sticky top-0 bg-[#0a0a0f] z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: column.color }} />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8888a0]">
            {column.title}
          </h3>
          <span className="font-mono text-[11px] text-[#555568] bg-[#1a1a26] px-1.5 py-0.5 rounded">
            {cards.length}
          </span>
        </div>
      </div>

      <button
        onClick={() => onAddCard(column.id)}
        className="flex items-center justify-center gap-1.5 w-[calc(100%-16px)] mx-2 mb-2 py-2 border border-dashed border-[#2a2a3a] rounded-lg bg-transparent text-[#555568] text-xs font-medium hover:border-[#555568] hover:text-[#8888a0] hover:bg-[#12121a] transition-all cursor-pointer"
      >
        + Add
      </button>

      <div className="flex-1 px-2 pb-2 overflow-y-auto">
        {cards.length === 0 && (
          <div className="flex items-center justify-center py-10 text-[#555568] text-xs">
            No quests here yet
          </div>
        )}
        {cards.map((card) => {
          const cat = categories.find((c) => c.id === card.category_id);
          const pri = PRIORITIES.find((p) => p.id === card.priority);
          const sorted = [...columns].sort((a, b) => a.position - b.position);
          const isDone = sorted.length > 0 && column.id === sorted[sorted.length - 1].id;
          const cardSubtasks = subtasks[card.id] || [];
          const subtaskProgress = cardSubtasks.length > 0 ? {
            done: cardSubtasks.filter(s => s.completed).length,
            total: cardSubtasks.length,
          } : null;
          return (
            <BoardCard
              key={card.id}
              card={card}
              category={cat}
              priority={pri}
              subtaskProgress={subtaskProgress}
              isDoneColumn={isDone}
              onClick={() => onCardClick(card)}
              onMenu={(x, y) => onCardMenu(card, x, y)}
            />
          );
        })}
      </div>
    </div>
  );
}
