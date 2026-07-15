import type { XPAction, LevelTitle, BadgeDefinition } from '@/types/database';

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
