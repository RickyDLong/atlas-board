'use client';

import type { Column, Card, Category, Subtask, Label, CardLabel } from '@/types/database';
import { PRIORITIES } from '@/types/database';
import { BoardCard } from './BoardCard';
import { useGamificationMode } from '@/contexts/GamificationModeContext';

interface BoardColumnProps {
  column: Column;
  cards: Card[];
  categories: Category[];
  columns?: Column[];
  subtasks?: Record<string, Subtask[]>;
  labels?: Label[];
  cardLabelsMap?: CardLabel[];
  onAddCard: (columnId: string) => void;
  onCardClick: (card: Card) => void;
  onCardMenu: (card: Card, x: number, y: number) => void;
  onDrop: (columnId: string, cardId: string) => void;
}

export function BoardColumn({
  column, cards, categories, subtasks = {}, labels = [], cardLabelsMap = [], onAddCard, onCardClick, onCardMenu, onDrop,
}: BoardColumnProps) {
  const { columnDisplayName, isGamified } = useGamificationMode();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) onDrop(column.id, cardId);
  };

  const displayTitle = columnDisplayName(column.title);

  // WIP limit status
  const wipLimit = column.wip_limit;
  const cardCount = cards.length;
  const isOverLimit = wipLimit !== null && cardCount > wipLimit;
  const isAtLimit = wipLimit !== null && cardCount === wipLimit;

  // Badge styles based on WIP status
  const countBadgeClasses = isOverLimit
    ? 'font-mono text-[11px] text-[#f87171] bg-[#f87171]/15 border border-[#f87171]/30 px-1.5 py-0.5 rounded'
    : isAtLimit
      ? 'font-mono text-[11px] text-[#fbbf24] bg-[#fbbf24]/15 border border-[#fbbf24]/30 px-1.5 py-0.5 rounded'
      : 'font-mono text-[11px] text-[#555568] bg-[#1a1a26] px-1.5 py-0.5 rounded';

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
            {displayTitle}
          </h3>
          <span className={countBadgeClasses}>
            {wipLimit !== null ? `${cardCount}/${wipLimit}` : cardCount}
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
          const isDone = column.is_done;
          const thisCardLabelIds = cardLabelsMap.filter(cl => cl.card_id === card.id).map(cl => cl.label_id);
          const thisCardLabels = labels.filter(l => thisCardLabelIds.includes(l.id));
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
              cardLabels={thisCardLabels}
              isDoneColumn={isDone}
              showShields={isGamified}
              onClick={() => onCardClick(card)}
              onMenu={(x, y) => onCardMenu(card, x, y)}
            />
          );
        })}
      </div>
    </div>
  );
}
