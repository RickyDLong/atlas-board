'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DailyQuest } from '@/lib/daily-quest-actions';
import { getTodayQuests } from '@/lib/daily-quest-actions';
import { createClient } from '@/lib/supabase/client';

interface DailyQuestsProps {
  userId: string | null;
  boardId: string | null;
}

function QuestRow({ quest }: { quest: DailyQuest }) {
  const pct = quest.target > 0 ? Math.min(quest.progress / quest.target, 1) : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium leading-tight"
          style={{ color: quest.completed ? '#34d399' : '#e8e8f0' }}
        >
          {quest.completed ? '\u2713 ' : ''}{quest.label}
        </span>
        <span className="text-[10px] font-mono text-[#555568] ml-2 shrink-0">
          +{quest.xp_reward} XP
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-[#1e1e2e] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct * 100}%`,
              background: quest.completed
                ? 'linear-gradient(90deg, #34d399, #22d3ee)'
                : 'linear-gradient(90deg, #4a9eff, #a855f7)',
            }}
          />
        </div>
        <span className="text-[10px] font-mono text-[#555568] shrink-0">
          {quest.progress}/{quest.target}
        </span>
      </div>
    </div>
  );
}

export function DailyQuests({ userId, boardId }: DailyQuestsProps) {
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const loadQuests = useCallback(async () => {
    if (!userId || !boardId) return;
    try {
      const data = await getTodayQuests(userId, boardId);
      setQuests(data);
    } catch {
      // Non-blocking — gamification is never fatal
    } finally {
      setLoading(false);
    }
  }, [userId, boardId]);

  useEffect(() => { loadQuests(); }, [loadQuests]);

  // Realtime: refresh when any daily_quest row changes for this user
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase.channel(`daily-quests-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_quests',
          filter: `user_id=eq.${userId}`,
        },
        () => { loadQuests(); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, loadQuests]);

  if (loading || quests.length === 0) return null;

  const completed = quests.filter(q => q.completed).length;
  const allDone = completed === quests.length;

  return (
    <div className="rounded-xl border border-[#1e1e2e] bg-[#12121a] overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#1a1a26] transition-colors cursor-pointer"
        onClick={() => setCollapsed(prev => !prev)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{allDone ? '\u{1F3C6}' : '\u{1F4DC}'}</span>
          <span className="text-xs font-semibold text-white">Daily Quests</span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
            style={{
              background: allDone ? '#34d39920' : '#4a9eff20',
              color: allDone ? '#34d399' : '#4a9eff',
            }}
          >
            {completed}/{quests.length}
          </span>
        </div>
        <span className="text-[#555568] text-xs">{collapsed ? '\u25B6' : '\u25BC'}</span>
      </button>

      {/* Quest list */}
      {!collapsed && (
        <div className="px-4 pb-3 flex flex-col gap-3 border-t border-[#1e1e2e] pt-3">
          {quests.map(q => (
            <QuestRow key={q.id} quest={q} />
          ))}
          {allDone && (
            <div className="text-center text-[10px] font-semibold text-[#34d399] mt-1">
              All quests complete! Come back tomorrow for more. 🔥
            </div>
          )}
        </div>
      )}
    </div>
  );
}
