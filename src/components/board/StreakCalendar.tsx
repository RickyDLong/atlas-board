'use client';

import { useEffect, useState, useMemo } from 'react';
import * as gamification from '@/lib/gamification-actions';

interface StreakCalendarProps {
  userId: string | null;
}

const INTENSITY_COLORS = ['#1a1a26', '#1a3a2e', '#2a6a4e', '#34d399'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const WEEKS = 20;

export function StreakCalendar({ userId }: StreakCalendarProps) {
  const [data, setData] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!userId) return;
    gamification.getXPEventsByDay(userId, WEEKS * 7).then(setData).catch(() => {});
  }, [userId]);

  // Build grid
  const grid = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from WEEKS ago, aligned to the start of the week (Sunday)
    const start = new Date(today);
    start.setDate(start.getDate() - (WEEKS * 7) + (7 - start.getDay()));

    const weeks: { date: string; xp: number; day: number }[][] = [];
    const current = new Date(start);

    for (let w = 0; w < WEEKS; w++) {
      const week: { date: string; xp: number; day: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = current.toISOString().slice(0, 10);
        week.push({
          date: dateStr,
          xp: data[dateStr] || 0,
          day: d,
        });
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [data]);

  // Determine intensity level (0-3) based on max XP in the dataset
  const maxXP = useMemo(() => {
    const vals = Object.values(data);
    return vals.length > 0 ? Math.max(...vals) : 100;
  }, [data]);

  const getIntensity = (xp: number): number => {
    if (xp === 0) return 0;
    if (xp <= maxXP * 0.33) return 1;
    if (xp <= maxXP * 0.66) return 2;
    return 3;
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex gap-0.5">
      {/* Day labels */}
      <div className="flex flex-col gap-0.5 mr-1">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="w-6 h-3 flex items-center justify-end">
            <span className="text-[8px] text-[#555568]">{label}</span>
          </div>
        ))}
      </div>

      {/* Weeks */}
      {grid.map((week, w) => (
        <div key={w} className="flex flex-col gap-0.5">
          {week.map((cell) => (
            <div
              key={cell.date}
              className="w-3 h-3 rounded-sm transition-colors"
              style={{
                background: INTENSITY_COLORS[getIntensity(cell.xp)],
                outline: cell.date === today ? '1px solid #4a9eff' : 'none',
              }}
              title={`${cell.date}: ${cell.xp} XP`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
