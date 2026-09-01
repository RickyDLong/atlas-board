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
  conquered_at: string | null;
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

export type RelationshipType = 'blocks' | 'related_to' | 'duplicates';

export interface CardRelationship {
  id: string;
  board_id: string;
  source_card_id: string;
  target_card_id: string;
  relationship_type: RelationshipType;
  created_at: string;
}

export interface CardFlag {
  id: string;
  board_id: string;
  card_id: string;
  label: string;
  color: string;
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

// ─── Gamification Types ─────────────────────────────────────

export interface XPEvent {
  id: string;
  user_id: string;
  board_id: string;
  action: string;
  xp_amount: number;
  /** Server-computed idempotency key; null on rows predating migration 028 */
  dedupe_key: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Outcome of a successful XP award. A deduped (already-granted) award yields null instead. */
export interface XPAwardResult {
  xpAwarded: number;
  action: XPAction;
  newTotalXP: number;
  newLevel: number;
  previousLevel: number;
  leveledUp: boolean;
  newTitle: string;
  newBadges: string[];
  streakUpdated: boolean;
  currentStreak: number;
  freezeUsed: boolean;
  freezeTokensRemaining: number;
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
