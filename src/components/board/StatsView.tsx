'use client';

import { useMemo } from 'react';
import type { Card, Category, Column, Epic } from '@/types/database';
import { PRIORITIES } from '@/types/database';

interface StatsViewProps {
  cards: Card[];
  categories: Category[];
  columns: Column[];
  epics: Epic[];
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#555568] mb-1">{label}</div>
      <div className="text-2xl font-bold font-mono" style={{ color: color || '#e8e8f0' }}>{value}</div>
      {sub && <div className="text-[11px] text-[#555568] mt-0.5">{sub}</div>}
    </div>
  );
}

function BarChart({ items, maxValue }: { items: { label: string; value: number; color: string }[]; maxValue: number }) {
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-[11px] text-[#8888a0] w-20 truncate text-right flex-shrink-0">{item.label}</span>
          <div className="flex-1 h-6 bg-[#1a1a26] rounded-md overflow-hidden relative">
            <div
              className="h-full rounded-md transition-all duration-500"
              style={{
                width: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : '0%',
                background: item.color,
                opacity: 0.7,
              }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold text-[#e8e8f0]">
              {item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsView({ cards, categories, columns, epics }: StatsViewProps) {
  const sortedCols = useMemo(() => [...columns].sort((a, b) => a.position - b.position), [columns]);
  const doneCol = sortedCols.length > 0 ? sortedCols[sortedCols.length - 1] : undefined;

  const stats = useMemo(() => {
    const total = cards.length;
    const done = doneCol ? cards.filter(c => c.column_id === doneCol.id).length : 0;
    const active = total - done;

    // Cards by column
    const byColumn = sortedCols.map(col => ({
      label: col.title,
      value: cards.filter(c => c.column_id === col.id).length,
      color: col.color,
    }));

    // Cards by category
    const byCategory = categories.map(cat => ({
      label: cat.label,
      value: cards.filter(c => c.category_id === cat.id).length,
      color: cat.color,
    })).sort((a, b) => b.value - a.value);

    // Cards with no category
    const uncategorized = cards.filter(c => !c.category_id).length;
    if (uncategorized > 0) {
      byCategory.push({ label: 'Uncategorized', value: uncategorized, color: '#555568' });
    }

    // Cards by priority
    const byPriority = PRIORITIES.map(p => ({
      label: p.label,
      value: cards.filter(c => c.priority === p.id).length,
      color: p.color,
    }));

    // Overdue cards
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const overdue = cards.filter(c =>
      c.due_date && c.due_date < todayStr && (!doneCol || c.column_id !== doneCol.id)
    ).length;

    // Due this week
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;
    const dueThisWeek = cards.filter(c =>
      c.due_date && c.due_date >= todayStr && c.due_date <= weekEndStr && (!doneCol || c.column_id !== doneCol.id)
    ).length;

    // Cards with no due date
    const noDueDate = cards.filter(c => !c.due_date && (!doneCol || c.column_id !== doneCol.id)).length;

    // Avg age of active cards (days since created)
    const activeCards = cards.filter(c => !doneCol || c.column_id !== doneCol.id);
    const avgAge = activeCards.length > 0
      ? Math.round(activeCards.reduce((sum, c) => {
          const created = new Date(c.created_at);
          return sum + Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / activeCards.length)
      : 0;

    // Epic progress
    const epicProgress = epics
      .filter(e => e.status !== 'archived')
      .map(e => {
        const epicCards = cards.filter(c => c.epic_id === e.id);
        const epicDone = doneCol ? epicCards.filter(c => c.column_id === doneCol.id).length : 0;
        return {
          name: e.name,
          color: e.color,
          total: epicCards.length,
          done: epicDone,
          pct: epicCards.length > 0 ? Math.round((epicDone / epicCards.length) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    return { total, done, active, byColumn, byCategory, byPriority, overdue, dueThisWeek, noDueDate, avgAge, epicProgress };
  }, [cards, categories, sortedCols, doneCol, epics]);

  const maxByCol = Math.max(...stats.byColumn.map(b => b.value), 1);
  const maxByCat = Math.max(...stats.byCategory.map(b => b.value), 1);
  const maxByPri = Math.max(...stats.byPriority.map(b => b.value), 1);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top-level metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Total Cards" value={stats.total} />
        <StatCard label="Active" value={stats.active} color="#4a9eff" />
        <StatCard label="Done" value={stats.done} color="#34d399" sub={stats.total > 0 ? `${Math.round((stats.done / stats.total) * 100)}% complete` : ''} />
        <StatCard label="Overdue" value={stats.overdue} color={stats.overdue > 0 ? '#f87171' : '#34d399'} />
        <StatCard label="Due This Week" value={stats.dueThisWeek} color="#fbbf24" />
        <StatCard label="Avg Age" value={`${stats.avgAge}d`} sub="active cards" color="#8888a0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cards by column */}
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-4">Cards by Status</h3>
          <BarChart items={stats.byColumn} maxValue={maxByCol} />
        </div>

        {/* Cards by priority */}
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-4">Cards by Priority</h3>
          <BarChart items={stats.byPriority} maxValue={maxByPri} />
        </div>

        {/* Cards by category */}
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-4">Cards by Category</h3>
          <BarChart items={stats.byCategory} maxValue={maxByCat} />
        </div>

        {/* Epic progress */}
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-4">Epic Progress</h3>
          {stats.epicProgress.length === 0 ? (
            <div className="text-[11px] text-[#3a3a4a] text-center py-4">No active epics</div>
          ) : (
            <div className="space-y-3">
              {stats.epicProgress.map(ep => (
                <div key={ep.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-[#e8e8f0] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm inline-block" style={{ background: ep.color }} />
                      {ep.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#8888a0]">{ep.done}/{ep.total}</span>
                  </div>
                  <div className="h-2 bg-[#1a1a26] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${ep.pct}%`,
                        background: ep.color,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cards needing attention */}
      {stats.noDueDate > 0 && (
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-2">Needs Attention</h3>
          <p className="text-[12px] text-[#8888a0]">
            <span className="font-mono font-semibold text-[#fbbf24]">{stats.noDueDate}</span> active card{stats.noDueDate !== 1 ? 's' : ''} with no due date set.
          </p>
        </div>
      )}
    </div>
  );
}
