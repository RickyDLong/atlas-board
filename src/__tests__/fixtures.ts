import type { Board, Column, Category, Card, Epic, UserLevel, UserStreak, UserBadge } from '@/types/database';

export const mockBoard: Board = {
  id: 'board-1',
  user_id: 'user-1',
  name: 'Test Board',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const mockColumns: Column[] = [
  { id: 'col-backlog', board_id: 'board-1', title: 'Quest Log', color: '#555568', position: 0, is_done: false, wip_limit: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'col-upnext', board_id: 'board-1', title: 'Preparing', color: '#fbbf24', position: 1, is_done: false, wip_limit: 5, created_at: '2026-01-01T00:00:00Z' },
  { id: 'col-inprogress', board_id: 'board-1', title: 'In Battle', color: '#4a9eff', position: 2, is_done: false, wip_limit: 3, created_at: '2026-01-01T00:00:00Z' },
  { id: 'col-review', board_id: 'board-1', title: 'Loot Check', color: '#a855f7', position: 3, is_done: false, wip_limit: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'col-done', board_id: 'board-1', title: 'Conquered', color: '#34d399', position: 4, is_done: true, wip_limit: null, created_at: '2026-01-01T00:00:00Z' },
];

export const mockCategories: Category[] = [
  { id: 'cat-side', board_id: 'board-1', label: 'Side Projects', color: '#4a9eff', position: 0, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-career', board_id: 'board-1', label: 'Career', color: '#34d399', position: 1, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-life', board_id: 'board-1', label: 'Life Admin', color: '#fbbf24', position: 2, created_at: '2026-01-01T00:00:00Z' },
];

export const mockEpics: Epic[] = [
  {
    id: 'epic-1', board_id: 'board-1', name: 'Atlas Board', description: 'Build the kanban board',
    color: '#4a9eff', status: 'active', target_date: '2026-06-01', archived_at: null,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'epic-2', board_id: 'board-1', name: 'KDP Publishing', description: 'Self-publishing pipeline',
    color: '#a855f7', status: 'planning', target_date: null, archived_at: null,
    created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-15T00:00:00Z',
  },
];

export const mockCards: Card[] = [
  {
    id: 'card-1', board_id: 'board-1', column_id: 'col-backlog', category_id: 'cat-side', epic_id: 'epic-1',
    title: 'Add dark mode', description: 'Implement theme toggle', priority: 'medium', effort: 'M',
    notes: null, due_date: '2026-04-15', estimated_hours: 4, actual_hours: null, archived_at: null, position: 0, column_changed_at: '2026-03-20T00:00:00Z', recurrence_rule: null, recurrence_source_id: null,
    created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-20T00:00:00Z',
  },
  {
    id: 'card-2', board_id: 'board-1', column_id: 'col-inprogress', category_id: 'cat-career', epic_id: null,
    title: 'Update resume', description: 'Add new projects', priority: 'high', effort: 'S',
    notes: 'Focus on frontend work', due_date: '2026-04-01', estimated_hours: 2, actual_hours: 1.5, archived_at: null, position: 0, column_changed_at: '2026-04-01T00:00:00Z', recurrence_rule: null, recurrence_source_id: null,
    created_at: '2026-03-10T00:00:00Z', updated_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'card-3', board_id: 'board-1', column_id: 'col-done', category_id: 'cat-side', epic_id: 'epic-1',
    title: 'Setup project', description: 'Initial scaffolding', priority: 'critical', effort: 'XS',
    notes: null, due_date: '2026-02-01', estimated_hours: 1, actual_hours: 0.75, archived_at: null, position: 0, column_changed_at: '2026-02-01T00:00:00Z', recurrence_rule: null, recurrence_source_id: null,
    created_at: '2026-01-15T00:00:00Z', updated_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'card-4', board_id: 'board-1', column_id: 'col-backlog', category_id: null, epic_id: null,
    title: 'No category card', description: null, priority: 'low', effort: null,
    notes: null, due_date: null, estimated_hours: null, actual_hours: null, archived_at: null, position: 1, column_changed_at: '2026-03-15T00:00:00Z', recurrence_rule: null, recurrence_source_id: null,
    created_at: '2026-03-15T00:00:00Z', updated_at: '2026-03-15T00:00:00Z',
  },
  {
    id: 'card-5', board_id: 'board-1', column_id: 'col-upnext', category_id: 'cat-life', epic_id: 'epic-2',
    title: 'Overdue task', description: 'This is past due', priority: 'high', effort: 'L',
    notes: null, due_date: '2026-03-01', estimated_hours: 8, actual_hours: null, archived_at: null, position: 0, column_changed_at: '2026-03-01T00:00:00Z', recurrence_rule: null, recurrence_source_id: null,
    created_at: '2026-02-20T00:00:00Z', updated_at: '2026-03-01T00:00:00Z',
  },
];

export function createMockCard(overrides: Partial<Card> = {}): Card {
  return {
    id: `card-${Math.random().toString(36).slice(2)}`,
    board_id: 'board-1',
    column_id: 'col-backlog',
    category_id: null,
    epic_id: null,
    title: 'Test Card',
    description: null,
    priority: 'medium',
    effort: null,
    notes: null,
    due_date: null,
    estimated_hours: null,
    actual_hours: null,
    archived_at: null,
    position: 0,
    column_changed_at: new Date().toISOString(),
    recurrence_rule: null,
    recurrence_source_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Gamification Fixtures ──────────────────────────────────

export const mockUserLevel: UserLevel = {
  user_id: 'user-1',
  current_xp: 1247,
  current_level: 12,
  title: 'Specialist',
  updated_at: '2026-04-01T00:00:00Z',
};

export const mockUserStreak: UserStreak = {
  user_id: 'user-1',
  current_streak: 14,
  longest_streak: 21,
  last_active_date: '2026-04-06',
  freeze_tokens: 1,
  updated_at: '2026-04-06T00:00:00Z',
};

export const mockUserBadges: UserBadge[] = [
  { id: 'badge-1', user_id: 'user-1', badge_key: 'first_blood', earned_at: '2026-02-01T00:00:00Z', progress: {} },
  { id: 'badge-2', user_id: 'user-1', badge_key: 'streak_starter', earned_at: '2026-03-15T00:00:00Z', progress: {} },
  { id: 'badge-3', user_id: 'user-1', badge_key: 'hat_trick', earned_at: '2026-03-20T00:00:00Z', progress: {} },
];
