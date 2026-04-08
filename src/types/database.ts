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
  is_done: boolean;
  wip_limit: number | null;
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
  estimated_hours: number | null;
  actual_hours: number | null;
  archived_at: string | null;
  position: number;
  column_changed_at: string | null;
  recurrence_rule: RecurrenceRule | null;
  recurrence_source_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: string;
  card_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}

export interface CardTemplate {
  id: string;
  board_id: string;
  name: string;
  template_data: {
    title?: string;
    description?: string;
    category_id?: string;
    priority?: string;
    effort?: string;
    epic_id?: string;
    notes?: string;
  };
  position: number;
  created_at: string;
}

export interface Label {
  id: string;
  board_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface CardLabel {
  card_id: string;
  label_id: string;
}

export interface SavedFilter {
  id: string;
  board_id: string;
  name: string;
  filters: {
    columnIds?: string[];
    categoryIds?: string[];
    priorities?: string[];
    epicIds?: string[];
    searchText?: string;
    dueDateRange?: { from?: string; to?: string };
  };
  position: number;
  created_at: string;
}

export interface CfdSnapshot {
  id: string;
  board_id: string;
  snapshot_date: string;
  column_counts: Record<string, number>;
  created_at: string;
}

export type ActivityAction = 'card_created' | 'card_updated' | 'card_moved' | 'card_archived' | 'card_deleted' | 'card_unarchived';

export interface ActivityLogEntry {
  id: string;
  board_id: string;
  card_id: string | null;
  user_id: string;
  action: ActivityAction;
  details: Record<string, unknown>;
  created_at: string;
}

export type RecurrenceRule = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

export const RECURRENCE_OPTIONS: { id: RecurrenceRule; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Biweekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
];

export type RelationshipType = 'blocks' | 'related_to' | 'duplicates';

export interface CardRelationship {
  id: string;
  board_id: string;
  source_card_id: string;
  target_card_id: string;
  relationship_type: RelationshipType;
  created_at: string;
}

export interface CardAttachment {
  id: string;
  card_id: string;
  board_id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  content_type: string;
  storage_path: string;
  created_at: string;
}

export interface CardComment {
  id: string;
  card_id: string;
  board_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface ColumnTransition {
  id: string;
  card_id: string;
  board_id: string;
  from_column_id: string | null;
  to_column_id: string;
  transitioned_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  overdue_notifications: boolean;
  notification_email: string | null;
  notification_time: string;
  has_seen_onboarding: boolean;
  gamification_enabled: boolean;
  created_at: string;
  updated_at: string;
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
  { minLevel: 50, title: 'Mythic Titan', color: '#fbbf24' },
  { minLevel: 40, title: 'Dragon Slayer', color: '#f87171' },
  { minLevel: 30, title: 'Shadow Monarch', color: '#fb923c' },
  { minLevel: 20, title: 'Runecaster', color: '#a855f7' },
  { minLevel: 10, title: 'Blade Adept', color: '#4a9eff' },
  { minLevel: 5, title: 'Squire', color: '#34d399' },
  { minLevel: 1, title: 'Wanderer', color: '#8888a0' },
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
