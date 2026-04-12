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
  // ─── Existing Badges ─────────────────────────────────────────
  { key: 'first_blood', name: 'First Blood', description: 'Complete your first card', icon: '🗡️', tier: 'bronze' },
  { key: 'hat_trick', name: 'Hat Trick', description: 'Complete 3 cards in one day', icon: '🎩', tier: 'bronze' },
  { key: 'streak_starter', name: 'Streak Starter', description: 'Reach a 7-day streak', icon: '🔥', tier: 'bronze' },
  { key: 'epic_closer', name: 'Epic Closer', description: 'Complete an entire epic', icon: '🟣', tier: 'silver' },
  { key: 'speed_demon', name: 'Speed Demon', description: 'Complete 5 cards before their due dates', icon: '⚡', tier: 'silver' },
  { key: 'monthly_machine', name: 'Monthly Machine', description: 'Reach a 30-day streak', icon: '💪', tier: 'silver' },
  { key: 'board_cleaner', name: 'Board Cleaner', description: 'Archive 50 completed cards', icon: '🧹', tier: 'silver' },
  { key: 'century_club', name: 'Century Club', description: 'Complete 100 total cards', icon: '💯', tier: 'gold' },
  { key: 'iron_will', name: 'Iron Will', description: 'Reach a 90-day streak', icon: '🛡️', tier: 'gold' },
  { key: 'atlas_ascendant', name: 'Atlas Ascendant', description: 'Reach Level 50', icon: '👑', tier: 'gold' },
  { key: 'zero_inbox', name: 'Zero Inbox', description: 'Clear every card on the board to Done', icon: '✨', tier: 'gold' },
  { key: 'discipline_king', name: 'Discipline King', description: 'Complete 25 cards on time in a row', icon: '🌟', tier: 'legendary' },

  // ─── Card Volume ─────────────────────────────────────────────
  { key: 'ten_down', name: 'Ten Down', description: 'Complete 10 total cards', icon: '🎯', tier: 'bronze' },
  { key: 'quarter_century', name: 'Quarter Century', description: 'Complete 25 total cards', icon: '🏹', tier: 'bronze' },
  { key: 'half_century', name: 'Half Century', description: 'Complete 50 total cards', icon: '⚔️', tier: 'silver' },
  { key: 'double_century', name: 'Double Century', description: 'Complete 200 total cards', icon: '🗡️', tier: 'gold' },
  { key: 'five_hundred', name: 'Five Hundred', description: 'Complete 500 total cards', icon: '💀', tier: 'legendary' },

  // ─── Same-Day Blitz ──────────────────────────────────────────
  { key: 'daily_double', name: 'Daily Double', description: 'Complete 5 cards in a single day', icon: '💫', tier: 'bronze' },
  { key: 'berserker', name: 'Berserker', description: 'Complete 10 cards in a single day', icon: '🌊', tier: 'silver' },
  { key: 'unstoppable', name: 'Unstoppable', description: 'Complete 20 cards in a single day', icon: '🌋', tier: 'gold' },

  // ─── Streak Milestones ───────────────────────────────────────
  { key: 'fortnight', name: 'Fortnight', description: 'Reach a 14-day streak', icon: '🔥', tier: 'bronze' },
  { key: 'steadfast', name: 'Steadfast', description: 'Reach a 21-day streak', icon: '🔥', tier: 'silver' },
  { key: 'half_year', name: 'Half Year', description: 'Reach a 180-day streak', icon: '🔥', tier: 'gold' },
  { key: 'eternal_flame', name: 'Eternal Flame', description: 'Reach a 365-day streak', icon: '🔥', tier: 'legendary' },

  // ─── Early Completions ───────────────────────────────────────
  { key: 'first_spark', name: 'First Spark', description: 'Complete your first card ahead of schedule', icon: '⚡', tier: 'bronze' },
  { key: 'ember', name: 'Ember', description: 'Complete 10 cards before their due date', icon: '⚡', tier: 'bronze' },
  { key: 'blaze', name: 'Blaze', description: 'Complete 25 cards before their due date', icon: '⚡', tier: 'silver' },
  { key: 'inferno', name: 'Inferno', description: 'Complete 50 cards before their due date', icon: '⚡', tier: 'gold' },
  { key: 'conflagration', name: 'Conflagration', description: 'Complete 100 cards before their due date', icon: '⚡', tier: 'legendary' },

  // ─── Level Milestones ────────────────────────────────────────
  { key: 'level_five', name: 'Rising', description: 'Reach Level 5', icon: '⭐', tier: 'bronze' },
  { key: 'level_ten', name: 'Hardened', description: 'Reach Level 10', icon: '⭐', tier: 'bronze' },
  { key: 'level_twenty', name: 'Veteran', description: 'Reach Level 20', icon: '⭐', tier: 'silver' },
  { key: 'level_thirty', name: 'Elite', description: 'Reach Level 30', icon: '⭐', tier: 'gold' },
  { key: 'level_forty', name: 'Apex', description: 'Reach Level 40', icon: '⭐', tier: 'gold' },

  // ─── Priority Mastery ────────────────────────────────────────
  { key: 'crisis_manager', name: 'Crisis Manager', description: 'Complete 10 critical-priority cards', icon: '🔴', tier: 'silver' },
  { key: 'fire_suppressor', name: 'Fire Suppressor', description: 'Complete 25 critical-priority cards', icon: '🔴', tier: 'gold' },
  { key: 'high_achiever', name: 'High Achiever', description: 'Complete 50 high-or-critical priority cards', icon: '🟠', tier: 'silver' },

  // ─── On-Time Delivery ────────────────────────────────────────
  { key: 'ahead_of_curve', name: 'Ahead of the Curve', description: 'Complete 25 cards on or before their due date', icon: '⏱️', tier: 'silver' },
  { key: 'clockwork', name: 'Clockwork', description: 'Complete 50 cards on or before their due date', icon: '⏱️', tier: 'gold' },
  { key: 'timekeeper', name: 'Timekeeper', description: 'Complete 100 cards on or before their due date', icon: '⏱️', tier: 'legendary' },

  // ─── Daily Quests ────────────────────────────────────────────
  { key: 'daily_duty', name: 'Daily Duty', description: 'Complete your first daily quest', icon: '📋', tier: 'bronze' },
  { key: 'triple_threat', name: 'Triple Threat', description: 'Complete all 3 daily quests in one day', icon: '🎯', tier: 'bronze' },
  { key: 'devoted', name: 'Devoted', description: 'Complete 30 daily quests total', icon: '📋', tier: 'silver' },
  { key: 'quest_master', name: 'Quest Master', description: 'Complete 100 daily quests total', icon: '📋', tier: 'gold' },

  // ─── Epic Mastery ────────────────────────────────────────────
  { key: 'epic_hunter', name: 'Epic Hunter', description: 'Complete 3 full epics', icon: '🏆', tier: 'silver' },
  { key: 'world_conqueror', name: 'World Conqueror', description: 'Complete 10 full epics', icon: '🏆', tier: 'gold' },
  { key: 'grand_architect', name: 'Grand Architect', description: 'Complete 25 full epics', icon: '🏆', tier: 'legendary' },

  // ─── Column Clearing ─────────────────────────────────────────
  { key: 'clean_sweep', name: 'Clean Sweep', description: 'Clear a column 5 times', icon: '🧹', tier: 'bronze' },
  { key: 'scorched_earth', name: 'Scorched Earth', description: 'Clear a column 10 times', icon: '🧹', tier: 'silver' },
  { key: 'purge_master', name: 'Purge Master', description: 'Clear a column 25 times', icon: '🧹', tier: 'gold' },

  // ─── Archiving ───────────────────────────────────────────────
  { key: 'archivist', name: 'Archivist', description: 'Archive 25 completed cards', icon: '📦', tier: 'bronze' },
  { key: 'deep_archive', name: 'Deep Archive', description: 'Archive 100 completed cards', icon: '📦', tier: 'gold' },

  // ─── Card Creation ───────────────────────────────────────────
  { key: 'world_builder', name: 'World Builder', description: 'Create 50 cards', icon: '🌍', tier: 'bronze' },
  { key: 'grand_creator', name: 'Grand Creator', description: 'Create 200 cards', icon: '🌍', tier: 'silver' },

  // ─── Special / Rare ──────────────────────────────────────────
  { key: 'ice_shield', name: 'Ice Shield', description: 'Have a streak freeze automatically save your streak', icon: '❄️', tier: 'bronze' },
  { key: 'night_owl', name: 'Night Owl', description: 'Complete 10 cards between midnight and 4am', icon: '🦉', tier: 'bronze' },
  { key: 'early_bird', name: 'Early Bird', description: 'Complete 10 cards between 5am and 8am', icon: '🐦', tier: 'bronze' },

  // ─── Badge Collector (Meta) ──────────────────────────────────
  { key: 'decorated', name: 'Decorated', description: 'Earn 10 badges', icon: '🏅', tier: 'bronze' },
  { key: 'trophy_room', name: 'Trophy Room', description: 'Earn 20 badges', icon: '🏆', tier: 'silver' },
  { key: 'completionist', name: 'Completionist', description: 'Earn 30 badges', icon: '🏆', tier: 'gold' },

  // ─── Thoroughness ────────────────────────────────────────────
  { key: 'thorough', name: 'Thorough', description: 'Complete a card with every subtask checked off', icon: '✅', tier: 'bronze' },
  { key: 'perfectionist', name: 'Perfectionist', description: 'Complete 25 cards with all subtasks finished', icon: '✅', tier: 'gold' },
];
