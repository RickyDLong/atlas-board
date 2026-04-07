export interface Board {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  board_id: string;
  title: string;
  color: string;
  position: number;
  created_at: string;
}

export interface Category {
  id: string;
  board_id: string;
  label: string;
  color: string;
  position: number;
  created_at: string;
}

export interface Epic {
  id: string;
  board_id: string;
  name: string;
  description: string | null;
  color: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  target_date: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  board_id: string;
  column_id: string;
  category_id: string | null;
  epic_id: string | null;
  title: string;
  description: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'XS' | 'S' | 'M' | 'L' | 'XL' | null;
  notes: string | null;
  due_date: string | null;
  archived_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export type Priority = Card['priority'];
export type Effort = NonNullable<Card['effort']>;
export type EpicStatus = Epic['status'];

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
  { title: 'Backlog', color: '#555568' },
  { title: 'Up Next', color: '#fbbf24' },
  { title: 'In Progress', color: '#4a9eff' },
  { title: 'Review', color: '#a855f7' },
  { title: 'Done', color: '#34d399' },
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
];
