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
  column_changed_at: string | null;
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

// ─── Gamification Types ─────────────────────────────────────

export interface XPEvent {
  id: string;
  user_id: string;
  board_id: string;
  action: string;
  xp_amount: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UserLevel {
  user_id: string;
  current_xp: number;
  current_level: number;
  title: string;
  updated_at: string;
}

export interface UserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  freeze_tokens: number;
  updated_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_key: string;
  earned_at: string;
  progress: Record<string, unknown>;
}

export type XPAction =
  | 'card_create'
  | 'card_complete'
  | 'card_complete_high'
  | 'card_complete_critical'
  | 'card_on_time'
  | 'card_early'
  | 'column_clear'
  | 'streak_daily'
  | 'streak_7day'
  | 'streak_30day'
  | 'epic_complete'
  | 'archive_batch';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'legendary';

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
}

export interface LevelTitle {
  minLevel: number;
  title: string;
  color: string;
}

// ─── Gamification Constants ─────────────────────────────────

export const XP_VALUES: Record<XPAction, number> = {
  card_create: 5,
  card_complete: 25,
  card_complete_high: 50,
  card_complete_critical: 75,
  card_on_time: 35,
  card_early: 15,
  column_clear: 100,
  streak_daily: 15,
  streak_7day: 100,
  streak_30day: 500,
  epic_complete: 200,
  archive_batch: 50,
};

export const PRIORITY_XP_MULTIPLIER: Record<string, number> = {
  low: 1.0,
  medium: 1.25,
  high: 1.5,
  critical: 2.0,
};

export const STREAK_XP_MULTIPLIER: { minDays: number; multiplier: number }[] = [
  { minDays: 30, multiplier: 1.75 },
  { minDays: 14, multiplier: 1.5 },
  { minDays: 7, multiplier: 1.25 },
  { minDays: 3, multiplier: 1.1 },
  { minDays: 0, multiplier: 1.0 },
];

export const LEVEL_TITLES: LevelTitle[] = [
  { minLevel: 50, title: 'Atlas Prime', color: '#fbbf24' },
  { minLevel: 40, title: 'Warlord', color: '#f87171' },
  { minLevel: 30, title: 'Commander', color: '#fb923c' },
  { minLevel: 20, title: 'Strategist', color: '#a855f7' },
  { minLevel: 10, title: 'Specialist', color: '#4a9eff' },
  { minLevel: 5, title: 'Apprentice', color: '#34d399' },
  { minLevel: 1, title: 'Recruit', color: '#8888a0' },
];

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { key: 'first_blood', name: 'First Blood', description: 'Complete your first card', icon: '\u{1F5E1}', tier: 'bronze' },
  { key: 'hat_trick', name: 'Hat Trick', description: 'Complete 3 cards in one day', icon: '\u{1F3A9}', tier: 'bronze' },
  { key: 'streak_starter', name: 'Streak Starter', description: 'Reach a 7-day streak', icon: '\u{1F525}', tier: 'bronze' },
  { key: 'epic_closer', name: 'Epic Closer', description: 'Complete an entire epic', icon: '\u{1F7E3}', tier: 'silver' },
  { key: 'speed_demon', name: 'Speed Demon', description: 'Complete 5 cards before their due dates', icon: '\u26A1', tier: 'silver' },
  { key: 'monthly_machine', name: 'Monthly Machine', description: 'Reach a 30-day streak', icon: '\u{1F4AA}', tier: 'silver' },
  { key: 'board_cleaner', name: 'Board Cleaner', description: 'Archive 50 completed cards', icon: '\u{1F9F9}', tier: 'silver' },
  { key: 'century_club', name: 'Century Club', description: 'Complete 100 total cards', icon: '\u{1F4AF}', tier: 'gold' },
  { key: 'iron_will', name: 'Iron Will', description: 'Reach a 90-day streak', icon: '\u{1F6E1}', tier: 'gold' },
  { key: 'atlas_ascendant', name: 'Atlas Ascendant', description: 'Reach Level 50', icon: '\u{1F451}', tier: 'gold' },
  { key: 'zero_inbox', name: 'Zero Inbox', description: 'Clear every card on the board to Done', icon: '\u2728', tier: 'gold' },
  { key: 'discipline_king', name: 'Discipline King', description: 'Complete 25 cards on time in a row', icon: '\u{1F31F}', tier: 'legendary' },
];
