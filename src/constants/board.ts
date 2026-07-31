import type { RecurrenceRule, Priority, EpicStatus, Effort } from '@/types/database';

export const RECURRENCE_OPTIONS: { id: RecurrenceRule; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Biweekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
];

export const PRIORITIES: { id: Priority; label: string; color: string }[] = [
  { id: 'critical', label: 'Critical', color: '#f87171' },
  { id: 'high', label: 'High', color: '#fb923c' },
  { id: 'medium', label: 'Medium', color: '#fbbf24' },
  { id: 'low', label: 'Low', color: '#34d399' },
];

export const EPIC_STATUSES: { id: EpicStatus; label: string; color: string }[] = [
  { id: 'planning', label: 'Planning', color: '#8888a0' },
  { id: 'active', label: 'Active', color: '#4a9eff' },
  { id: 'completed', label: 'Completed', color: '#34d399' },
  { id: 'archived', label: 'Archived', color: '#555568' },
];

export const EFFORTS: Effort[] = ['XS', 'S', 'M', 'L', 'XL'];

export const DEFAULT_COLUMNS = [
  { title: 'Quest Log', color: '#555568', is_done: false, wip_limit: null },
  { title: 'Preparing', color: '#fbbf24', is_done: false, wip_limit: null },
  { title: 'In Battle', color: '#4a9eff', is_done: false, wip_limit: null },
  { title: 'Loot Check', color: '#a855f7', is_done: false, wip_limit: null },
  { title: 'Conquered', color: '#34d399', is_done: true, wip_limit: null },
];

export const DEFAULT_CATEGORIES = [
  { label: 'Side Projects', color: '#4a9eff' },
  { label: 'KDP / Publishing', color: '#a855f7' },
  { label: 'Career', color: '#34d399' },
  { label: 'Life Admin', color: '#fbbf24' },
];

export const PRESET_COLORS = [
  '#4a9eff', '#a855f7', '#34d399', '#fbbf24', '#f87171', '#fb923c',
  '#f472b6', '#06b6d4', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b',
  '#ec4899', '#14b8a6', '#6366f1', '#22c55e', '#e11d48', '#eab308',
  '#0ea5e9', '#84cc16', '#f97316', '#d946ef', '#3b82f6', '#2dd4bf',
  '#facc15', '#fb7185', '#c084fc', '#38bdf8', '#a3e635', '#818cf8',
];
