'use client';

import { useMemo, useState } from 'react';
import type { Card, Category, Column, Epic } from '@/types/database';
import { PRIORITIES } from '@/types/database';

interface RoadmapViewProps {
  cards: Card[];
  categories: Category[];
  columns: Column[];
  epics: Epic[];
  onCardClick: (card: Card) => void;
}

const DAY_WIDTH = 34;      // px per day column
const VISIBLE_DAYS = 42;   // 6-week window
const CARD_HEIGHT = 30;    // px per card bar
const CARD_GAP = 4;        // vertical gap between stacked cards in same lane
const LANE_PADDING = 8;    // top/bottom padding inside each lane
const CARD_WIDTH = 126;    // px wide per card bar

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtMonthYear(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function RoadmapView({ cards, categories, columns, epics, onCardClick }: RoadmapViewProps) {
  const [startOffset, setStartOffset] = useState(-7); // days from today to start

  const today = useMemo(() => startOfDay(new Date()), []);
  const rangeStart = useMemo(() => startOfDay(addDays(today, startOffset)), [today, startOffset]);
  const rangeEnd = useMemo(() => addDays(rangeStart, VISIBLE_DAYS), [rangeStart]);

  const doneColId = columns.find(c => c.is_done)?.id;
  const activeCards = useMemo(
    () => cards.filter(c => !c.archived_at && c.column_id !== doneColId),
    [cards, doneColId],
  );

  const scheduledCards = useMemo(
    () => activeCards.filter(c => {
      if (!c.due_date) return false;
      const d = new Date(c.due_date + 'T00:00:00');
      return d >= rangeStart && d < rangeEnd;
    }),
    [activeCards, rangeStart, rangeEnd],
  );

  const unscheduledCards = useMemo(
    () => activeCards.filter(c => !c.due_date),
    [activeCards],
  );

  const activeEpics = useMemo(
    () => epics.filter(e => e.status !== 'archived'),
    [epics],
  );

  // Days and week groups for the column header
  const days = useMemo(
    () => Array.from({ length: VISIBLE_DAYS }, (_, i) => addDays(rangeStart, i)),
    [rangeStart],
  );

  const weeks = useMemo(() => {
    const out: { label: string; startIdx: number }[] = [];
    days.forEach((d, i) => {
      if (i === 0 || d.getDay() === 0) {
        out.push({ label: fmtShort(d), startIdx: i });
      }
    });
    return out;
  }, [days]);

  const totalWidth = VISIBLE_DAYS * DAY_WIDTH;
  const todayOffset = Math.floor((today.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
  const hasTodayInRange = todayOffset >= 0 && todayOffset < VISIBLE_DAYS;

  // For a given epic (null = no epic), compute stacked card layout for this range
  const getEpicLayout = (epicId: string | null) => {
    const lane = scheduledCards.filter(c => epicId === null ? !c.epic_id : c.epic_id === epicId);
    lane.sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

    const placed: { card: Card; x: number; row: number }[] = [];
    for (const card of lane) {
      const dayIdx = Math.floor(
        (new Date(card.due_date! + 'T00:00:00').getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      const x = dayIdx * DAY_WIDTH;
      let row = 0;
      while (placed.some(p => p.row === row && Math.abs(p.x - x) < CARD_WIDTH + 4)) row++;
      placed.push({ card, x, row });
    }

    const maxRow = placed.length ? Math.max(...placed.map(p => p.row)) : -1;
    const laneH =
      LANE_PADDING * 2 +
      (maxRow >= 0 ? (maxRow + 1) * (CARD_HEIGHT + CARD_GAP) - CARD_GAP : CARD_HEIGHT);

    return { placed, laneH };
  };

  // Determine which epic lanes to show
  const epicLanes = useMemo(() => {
    const out: { id: string | null; epic: Epic | null }[] = activeEpics.map(e => ({ id: e.id, epic: e }));
    if (scheduledCards.some(c => !c.epic_id)) out.push({ id: null, epic: null });
    return out;
  }, [activeEpics, scheduledCards]);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">

      {/* Controls */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-[#1e1e2e] bg-[#0e0e16] shrink-0">
        <button
          onClick={() => setStartOffset(o => o - 7)}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-[#2a2a3a] text-[#8888a0] hover:text-white hover:bg-[#1a1a26] transition-all cursor-pointer text-base leading-none"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-[#e8e8f0] w-40 text-center tabular-nums">
          {fmtMonthYear(rangeStart)}
        </span>
        <button
          onClick={() => setStartOffset(o => o + 7)}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-[#2a2a3a] text-[#8888a0] hover:text-white hover:bg-[#1a1a26] transition-all cursor-pointer text-base leading-none"
        >
          ›
        </button>
        <button
          onClick={() => setStartOffset(-7)}
          className="px-3 h-7 rounded-md border border-[#2a2a3a] text-[#555568] hover:text-[#4a9eff] hover:border-[#4a9eff] transition-all cursor-pointer text-xs"
        >
          Today
        </button>
        <span className="ml-auto text-[11px] text-[#555568]">
          {scheduledCards.length} scheduled &middot; {unscheduledCards.length} unscheduled
        </span>
      </div>

      {/* Board: left label rail + right scrollable canvas */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Epic labels (fixed left rail) */}
        <div className="w-44 shrink-0 border-r border-[#1e1e2e] bg-[#0a0a0f] flex flex-col">
          {/* Header spacer */}
          <div className="h-10 shrink-0 border-b border-[#1e1e2e]" />

          {/* Epic rows */}
          <div className="overflow-y-auto flex-1">
            {epicLanes.map(({ id, epic }) => {
              const { laneH } = getEpicLayout(id);
              return (
                <div
                  key={id ?? '__no_epic__'}
                  className="flex items-start px-3 pt-2 border-b border-[#1a1a26]"
                  style={{ minHeight: laneH }}
                >
                  {epic ? (
                    <div className="flex flex-col gap-1 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: epic.color }} />
                        <span className="text-xs font-medium text-[#e8e8f0] line-clamp-2 leading-tight">{epic.name}</span>
                      </div>
                      {epic.target_date && (
                        <span className="text-[10px] text-[#555568] pl-3">
                          Target: {new Date(epic.target_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-[#555568] italic pt-0.5">No Epic</span>
                  )}
                </div>
              );
            })}

            {unscheduledCards.length > 0 && (
              <div className="px-3 py-3 border-b border-[#1a1a26]">
                <span className="text-xs text-[#555568] italic">Unscheduled</span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable timeline canvas */}
        <div className="flex-1 overflow-auto bg-[#0a0a0f]">
          <div style={{ width: totalWidth, minWidth: totalWidth }}>

            {/* Week header */}
            <div className="flex h-10 border-b border-[#1e1e2e] sticky top-0 bg-[#0a0a0f] z-10">
              {weeks.map((w, wi) => {
                const nextStart = wi + 1 < weeks.length ? weeks[wi + 1].startIdx : VISIBLE_DAYS;
                const wWidth = (nextStart - w.startIdx) * DAY_WIDTH;
                return (
                  <div
                    key={wi}
                    className="flex items-end pb-1.5 px-2 border-r border-[#1a1a26] shrink-0"
                    style={{ width: wWidth }}
                  >
                    <span className="text-[10px] text-[#555568] font-medium">{w.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Lanes */}
            <div className="relative">

              {/* Week grid lines */}
              {weeks.map((w, wi) => (
                <div
                  key={wi}
                  className="absolute top-0 bottom-0 w-px pointer-events-none"
                  style={{ left: w.startIdx * DAY_WIDTH, background: '#1a1a26' }}
                />
              ))}

              {/* Today line */}
              {hasTodayInRange && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-20"
                  style={{
                    left: todayOffset * DAY_WIDTH + DAY_WIDTH / 2,
                    width: 1,
                    background: 'linear-gradient(to bottom, #4a9eff88, #4a9eff22)',
                  }}
                />
              )}

              {/* Epic lanes */}
              {epicLanes.map(({ id }) => {
                const { placed, laneH } = getEpicLayout(id);
                return (
                  <div
                    key={id ?? '__no_epic__'}
                    className="relative border-b border-[#1a1a26]"
                    style={{ height: laneH }}
                  >
                    {placed.map(({ card, x, row }) => {
                      const pri = PRIORITIES.find(p => p.id === card.priority);
                      const t2 = new Date(); t2.setHours(0, 0, 0, 0);
                      const due = new Date(card.due_date! + 'T00:00:00');
                      const diff = Math.ceil((due.getTime() - t2.getTime()) / 864e5);
                      const accentColor =
                        diff < 0 ? '#f87171' :
                        diff === 0 ? '#fbbf24' :
                        diff <= 3 ? '#fb923c' :
                        (pri?.color ?? '#555568');

                      return (
                        <button
                          key={card.id}
                          onClick={() => onCardClick(card)}
                          className="absolute rounded-md text-left cursor-pointer hover:brightness-125 transition-all overflow-hidden"
                          style={{
                            left: x,
                            top: LANE_PADDING + row * (CARD_HEIGHT + CARD_GAP),
                            width: CARD_WIDTH,
                            height: CARD_HEIGHT,
                            background: '#12121a',
                            border: `1px solid ${accentColor}33`,
                            borderLeft: `3px solid ${accentColor}`,
                          }}
                          title={`${card.title} · due ${card.due_date}`}
                        >
                          <div className="flex flex-col justify-center h-full px-2">
                            <span className="text-[10px] font-medium text-[#e8e8f0] truncate leading-tight">
                              {card.title}
                            </span>
                            {card.effort && (
                              <span className="text-[9px] text-[#555568] font-mono leading-none mt-0.5">
                                {card.effort}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Unscheduled section */}
            {unscheduledCards.length > 0 && (
              <div className="border-b border-[#1a1a26] px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {unscheduledCards.map(card => {
                    const cat = categories.find(c => c.id === card.category_id);
                    const pri = PRIORITIES.find(p => p.id === card.priority);
                    const accent = cat?.color ?? pri?.color ?? '#555568';
                    return (
                      <button
                        key={card.id}
                        onClick={() => onCardClick(card)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md cursor-pointer hover:brightness-125 transition-all"
                        style={{
                          background: '#12121a',
                          border: '1px solid #2a2a3a',
                          borderLeft: `3px solid ${accent}`,
                        }}
                        title={card.title}
                      >
                        <span className="text-[11px] text-[#8888a0] max-w-[160px] truncate">{card.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
