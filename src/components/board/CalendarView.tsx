'use client';

import { useState, useMemo } from 'react';
import type { Card, Category, Column } from '@/types/database';
import { PRIORITIES } from '@/types/database';

interface CalendarViewProps {
  cards: Card[];
  categories: Category[];
  columns: Column[];
  onCardClick: (card: Card) => void;
  onAddCard: (date: string, columnId: string) => void;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({ cards, categories, columns, onCardClick, onAddCard }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  // Group cards by due date
  const cardsByDate = useMemo(() => {
    const map: Record<string, Card[]> = {};
    for (const card of cards) {
      if (!card.due_date) continue;
      const key = card.due_date; // YYYY-MM-DD
      if (!map[key]) map[key] = [];
      map[key].push(card);
    }
    // Sort each day's cards by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }
    return map;
  }, [cards]);

  // Cards without due dates
  const unscheduledCards = useMemo(() => cards.filter(c => !c.due_date), [cards]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Build calendar grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to complete the last week
  while (cells.length % 7 !== 0) cells.push(null);

  const defaultColumnId = columns[0]?.id || '';

  // Determine Done column for dimming
  const doneColId = columns.find(c => c.is_done)?.id || '';

  return (
    <div className="flex flex-1 min-h-0">
      {/* Calendar grid */}
      <div className="flex-1 flex flex-col p-4">
        {/* Header controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white font-[family-name:var(--font-space-grotesk)]">
              {MONTH_NAMES[month]} {year}
            </h2>
            <button
              onClick={goToToday}
              className="text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#2a2a3a] text-[#8888a0] hover:bg-[#1a1a26] hover:text-white transition-all cursor-pointer"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#2a2a3a] text-[#8888a0] hover:bg-[#1a1a26] hover:text-white transition-all cursor-pointer text-sm"
            >
              &#8249;
            </button>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#2a2a3a] text-[#8888a0] hover:bg-[#1a1a26] hover:text-white transition-all cursor-pointer text-sm"
            >
              &#8250;
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#555568] py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 flex-1 border-t border-l border-[#1e1e2e]">
          {cells.map((day, i) => {
            const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
            const dayCards = dateStr ? (cardsByDate[dateStr] || []) : [];
            const isToday = dateStr === todayStr;
            const isPast = dateStr ? dateStr < todayStr : false;
            const hasOverdue = dayCards.some(c => isPast && c.column_id !== doneColId);

            return (
              <div
                key={i}
                className={`border-r border-b border-[#1e1e2e] min-h-[100px] p-1.5 relative group transition-colors ${
                  day ? 'bg-[#0a0a0f] hover:bg-[#0e0e16]' : 'bg-[#08080c]'
                } ${isToday ? 'ring-1 ring-inset ring-[#4a9eff]/40' : ''}`}
              >
                {day && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-medium font-mono ${
                        isToday ? 'text-[#4a9eff] bg-[#4a9eff]/15 rounded-full w-6 h-6 flex items-center justify-center -ml-0.5' :
                        isPast ? 'text-[#3a3a4a]' : 'text-[#8888a0]'
                      }`}>
                        {day}
                      </span>
                      <button
                        onClick={() => onAddCard(dateStr!, defaultColumnId)}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-[#555568] hover:text-white hover:bg-[#22222f] transition-all text-xs cursor-pointer"
                        title="Add card"
                      >
                        +
                      </button>
                    </div>
                    {hasOverdue && (
                      <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#f87171]" title="Overdue cards" />
                    )}
                    <div className="space-y-0.5 overflow-y-auto max-h-[calc(100%-24px)]">
                      {dayCards.map(card => {
                        const cat = categories.find(c => c.id === card.category_id);
                        const pri = PRIORITIES.find(p => p.id === card.priority);
                        const isDone = card.column_id === doneColId;

                        return (
                          <button
                            key={card.id}
                            onClick={() => onCardClick(card)}
                            className={`w-full text-left px-1.5 py-1 rounded text-[10px] leading-tight truncate border-l-2 transition-all cursor-pointer hover:brightness-125 ${
                              isDone ? 'opacity-40 line-through' : ''
                            }`}
                            style={{
                              borderLeftColor: pri?.color || '#555',
                              background: (cat?.color || '#555') + '10',
                              color: '#e8e8f0',
                            }}
                            title={`${card.title} — ${pri?.label || 'Medium'}`}
                          >
                            {card.title}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Unscheduled sidebar */}
      <div className="w-56 border-l border-[#1e1e2e] bg-[#0e0e16] flex flex-col">
        <div className="px-3 py-3 border-b border-[#1e1e2e]">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#555568]">
            No Due Date <span className="font-mono text-[#8888a0] ml-1">{unscheduledCards.length}</span>
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {unscheduledCards.map(card => {
            const cat = categories.find(c => c.id === card.category_id);
            const pri = PRIORITIES.find(p => p.id === card.priority);
            const col = columns.find(c => c.id === card.column_id);
            return (
              <button
                key={card.id}
                onClick={() => onCardClick(card)}
                className="w-full text-left px-2 py-1.5 rounded-md bg-[#12121a] border border-[#1e1e2e] hover:border-[#2a2a3a] transition-all cursor-pointer group"
              >
                <div className="text-[11px] text-[#e8e8f0] leading-snug truncate">{card.title}</div>
                <div className="flex items-center gap-1 mt-1">
                  {cat && (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                  )}
                  <span className="text-[9px] font-mono" style={{ color: pri?.color || '#555' }}>{pri?.label}</span>
                  <span className="text-[9px] text-[#3a3a4a] ml-auto">{col?.title}</span>
                </div>
              </button>
            );
          })}
          {unscheduledCards.length === 0 && (
            <div className="text-[11px] text-[#3a3a4a] text-center py-4">All cards have dates</div>
          )}
        </div>
      </div>
    </div>
  );
}
