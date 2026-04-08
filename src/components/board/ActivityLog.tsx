'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ActivityLogEntry, Column } from '@/types/database';
import * as actions from '@/lib/board-actions';

interface ActivityLogProps {
  boardId: string;
  cardId?: string;
  columns: Column[];
}

function formatAction(entry: ActivityLogEntry, columns: Column[]): string {
  const details = entry.details as Record<string, string | string[] | undefined>;
  switch (entry.action) {
    case 'card_created':
      return `Created card "${details.title || 'Untitled'}"`;
    case 'card_updated': {
      const fields = details.fields as string[] | undefined;
      return fields?.length ? `Updated ${fields.join(', ')}` : 'Updated card';
    }
    case 'card_moved': {
      const from = columns.find(c => c.id === details.from_column);
      const to = columns.find(c => c.id === details.to_column);
      return `Moved ${from?.title || '?'} → ${to?.title || '?'}`;
    }
    case 'card_archived':
      return `Archived "${details.title || 'card'}"`;
    case 'card_unarchived':
      return `Unarchived "${details.title || 'card'}"`;
    case 'card_deleted':
      return `Deleted "${details.title || 'card'}"`;
    default:
      return entry.action;
  }
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const ACTION_ICONS: Record<string, string> = {
  card_created: '✦',
  card_updated: '✎',
  card_moved: '→',
  card_archived: '▼',
  card_unarchived: '▲',
  card_deleted: '✕',
};

const ACTION_COLORS: Record<string, string> = {
  card_created: '#34d399',
  card_updated: '#4a9eff',
  card_moved: '#fbbf24',
  card_archived: '#555568',
  card_unarchived: '#a855f7',
  card_deleted: '#f87171',
};

export function ActivityLog({ boardId, cardId, columns }: ActivityLogProps) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = cardId
        ? await actions.getCardActivityLog(cardId)
        : await actions.getActivityLog(boardId);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load activity:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [boardId, cardId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="text-[12px] text-[#555568] py-4 text-center">Loading activity...</div>
    );
  }

  if (error) {
    return (
      <div className="text-[12px] text-[#555568] py-4 text-center">
        Failed to load activity.{' '}
        <button onClick={load} className="text-[#4a9eff] hover:underline cursor-pointer">Retry</button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-[12px] text-[#555568] py-4 text-center">No activity yet</div>
    );
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, i) => (
        <div key={entry.id} className="flex items-start gap-2.5 py-2 relative">
          {/* Timeline line */}
          {i < entries.length - 1 && (
            <div className="absolute left-[9px] top-[22px] bottom-0 w-px bg-[#1e1e2e]" />
          )}
          {/* Icon dot */}
          <div
            className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] flex-shrink-0 mt-0.5"
            style={{ background: `${ACTION_COLORS[entry.action] || '#555568'}20`, color: ACTION_COLORS[entry.action] || '#555568' }}
          >
            {ACTION_ICONS[entry.action] || '•'}
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-[#c8c8d0] leading-snug truncate">
              {formatAction(entry, columns)}
            </p>
            <p className="text-[10px] text-[#555568] mt-0.5">{timeAgo(entry.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
