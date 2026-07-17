import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardCard, getShieldAging, getDueDateBadge } from './BoardCard';
import { mockCards, mockCategories, createMockCard } from '@/__tests__/fixtures';
import { PRIORITIES } from '@/constants/board';

describe('BoardCard', () => {
  const defaultCard = mockCards[0]; // 'Add dark mode', medium priority, Side Projects
  const category = mockCategories.find(c => c.id === defaultCard.category_id);
  const priority = PRIORITIES.find(p => p.id === defaultCard.priority);

  const defaultProps = {
    card: defaultCard,
    category,
    priority,
    onClick: vi.fn(),
    onMenu: vi.fn(),
  };

  it('renders the card title', () => {
    render(<BoardCard {...defaultProps} />);
    expect(screen.getByText('Add dark mode')).toBeInTheDocument();
  });

  it('renders the card description truncated', () => {
    render(<BoardCard {...defaultProps} />);
    expect(screen.getByText('Implement theme toggle')).toBeInTheDocument();
  });

  it('renders category badge when category exists', () => {
    render(<BoardCard {...defaultProps} />);
    expect(screen.getByText('Side Projects')).toBeInTheDocument();
  });

  it('renders priority badge', () => {
    render(<BoardCard {...defaultProps} />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('renders effort badge when effort is set', () => {
    render(<BoardCard {...defaultProps} />);
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('does not render effort badge when effort is null', () => {
    const card = { ...defaultCard, effort: null as null };
    render(<BoardCard {...defaultProps} card={card} />);
    expect(screen.queryByText('XS')).not.toBeInTheDocument();
  });

  it('does not render category badge when category is undefined', () => {
    render(<BoardCard {...defaultProps} category={undefined} />);
    expect(screen.queryByText('Side Projects')).not.toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const onClick = vi.fn();
    render(<BoardCard {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByText('Add dark mode'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders due date badge when due_date is set', () => {
    render(<BoardCard {...defaultProps} />);
    const badge = screen.getByText(/\d+d/);
    expect(badge).toBeInTheDocument();
  });

  it('does not render due date badge when due_date is null', () => {
    const card = { ...defaultCard, due_date: null };
    render(<BoardCard {...defaultProps} card={card} />);
    expect(screen.queryByText(/\d+d$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/overdue/)).not.toBeInTheDocument();
  });

  it('shows overdue styling for past-due cards', () => {
    const overdueCard = { ...defaultCard, due_date: '2020-01-01' };
    render(<BoardCard {...defaultProps} card={overdueCard} />);
    const badge = screen.getByText(/overdue/i);
    expect(badge).toBeInTheDocument();
  });

  it('does not flag a past-due card as overdue once it reaches a done column', () => {
    const overdueCard = { ...defaultCard, due_date: '2020-01-01' };
    render(<BoardCard {...defaultProps} card={overdueCard} isDoneColumn={true} />);
    expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
    expect(screen.getByText('Jan 1')).toBeInTheDocument();
  });

  // ─── Shield aging indicator tests ─────────────────────────

  it('renders shield aging indicator on non-done cards', () => {
    render(<BoardCard {...defaultProps} isDoneColumn={false} />);
    const shieldContainer = screen.getByTestId('shield-aging');
    expect(shieldContainer).toBeInTheDocument();
    const shields = shieldContainer.querySelectorAll('svg');
    expect(shields.length).toBeGreaterThan(0);
  });

  it('does not render shield aging indicator on done column', () => {
    render(<BoardCard {...defaultProps} isDoneColumn={true} />);
    expect(screen.queryByTestId('shield-aging')).not.toBeInTheDocument();
  });

  it('renders 1 green shield for a card moved today', () => {
    const card = createMockCard({ column_changed_at: new Date().toISOString() });
    render(<BoardCard {...defaultProps} card={card} isDoneColumn={false} />);
    const shieldContainer = screen.getByTestId('shield-aging');
    const shields = shieldContainer.querySelectorAll('svg');
    expect(shields.length).toBe(1);
    expect(shields[0]).toHaveAttribute('fill', '#34d399');
  });

  it('renders 2 yellow shields for a card 3 days old in column', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const card = createMockCard({ column_changed_at: threeDaysAgo.toISOString() });
    render(<BoardCard {...defaultProps} card={card} isDoneColumn={false} />);
    const shieldContainer = screen.getByTestId('shield-aging');
    const shields = shieldContainer.querySelectorAll('svg');
    expect(shields.length).toBe(2);
    expect(shields[0]).toHaveAttribute('fill', '#fbbf24');
  });

  it('renders 3 orange shields for a card 6 days old in column', () => {
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    const card = createMockCard({ column_changed_at: sixDaysAgo.toISOString() });
    render(<BoardCard {...defaultProps} card={card} isDoneColumn={false} />);
    const shieldContainer = screen.getByTestId('shield-aging');
    const shields = shieldContainer.querySelectorAll('svg');
    expect(shields.length).toBe(3);
    expect(shields[0]).toHaveAttribute('fill', '#fb923c');
  });

  it('renders 4 red shields for a card 8+ days old in column', () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const card = createMockCard({ column_changed_at: tenDaysAgo.toISOString() });
    render(<BoardCard {...defaultProps} card={card} isDoneColumn={false} />);
    const shieldContainer = screen.getByTestId('shield-aging');
    const shields = shieldContainer.querySelectorAll('svg');
    expect(shields.length).toBe(4);
    expect(shields[0]).toHaveAttribute('fill', '#f87171');
  });

  it('falls back to updated_at when column_changed_at is null', () => {
    const card = createMockCard({ column_changed_at: null, updated_at: new Date().toISOString() });
    render(<BoardCard {...defaultProps} card={card} isDoneColumn={false} />);
    const shieldContainer = screen.getByTestId('shield-aging');
    const shields = shieldContainer.querySelectorAll('svg');
    expect(shields.length).toBe(1); // fresh — today
    expect(shields[0]).toHaveAttribute('fill', '#34d399');
  });
});

// ─── getShieldAging pure function tests ─────────────────────

describe('getShieldAging', () => {
  const makeCard = (daysAgo: number, columnChangedAt: boolean = true) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return createMockCard({
      column_changed_at: columnChangedAt ? date.toISOString() : null,
      updated_at: date.toISOString(),
    });
  };

  it('returns null for done column', () => {
    expect(getShieldAging(makeCard(0), true)).toBeNull();
  });

  it('returns 1 green shield for 0 days', () => {
    const result = getShieldAging(makeCard(0), false);
    expect(result).toEqual({ count: 1, color: '#34d399', label: 'Today' });
  });

  it('returns 1 green shield for 1 day', () => {
    const result = getShieldAging(makeCard(1), false);
    expect(result).toEqual({ count: 1, color: '#34d399', label: '1 day in column' });
  });

  it('returns 1 green shield for 2 days', () => {
    const result = getShieldAging(makeCard(2), false);
    expect(result).toEqual({ count: 1, color: '#34d399', label: '2 days in column' });
  });

  it('returns 2 yellow shields for 3 days', () => {
    const result = getShieldAging(makeCard(3), false);
    expect(result).toEqual({ count: 2, color: '#fbbf24', label: '3 days in column' });
  });

  it('returns 2 yellow shields for 4 days', () => {
    const result = getShieldAging(makeCard(4), false);
    expect(result).toEqual({ count: 2, color: '#fbbf24', label: '4 days in column' });
  });

  it('returns 3 orange shields for 5 days', () => {
    const result = getShieldAging(makeCard(5), false);
    expect(result).toEqual({ count: 3, color: '#fb923c', label: '5 days in column' });
  });

  it('returns 3 orange shields for 7 days', () => {
    const result = getShieldAging(makeCard(7), false);
    expect(result).toEqual({ count: 3, color: '#fb923c', label: '7 days in column' });
  });

  it('returns 4 red shields for 8 days', () => {
    const result = getShieldAging(makeCard(8), false);
    expect(result).toEqual({ count: 4, color: '#f87171', label: '8 days in column' });
  });

  it('returns 4 red shields for 30 days', () => {
    const result = getShieldAging(makeCard(30), false);
    expect(result).toEqual({ count: 4, color: '#f87171', label: '30 days in column' });
  });

  it('uses updated_at as fallback when column_changed_at is null', () => {
    const result = getShieldAging(makeCard(5, false), false);
    expect(result).toEqual({ count: 3, color: '#fb923c', label: '5 days in column' });
  });
});

describe('getDueDateBadge', () => {
  const makeCard = (dueInDays: number | null) => {
    if (dueInDays === null) return createMockCard({ due_date: null });
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + dueInDays);
    const due = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return createMockCard({ due_date: due });
  };

  it('returns null when the card has no due date', () => {
    expect(getDueDateBadge(makeCard(null), false)).toBeNull();
  });

  it('labels a past-due card as overdue in red', () => {
    expect(getDueDateBadge(makeCard(-5), false)).toEqual({ color: '#f87171', label: '5d overdue' });
  });

  it('labels a card due today in amber', () => {
    expect(getDueDateBadge(makeCard(0), false)).toEqual({ color: '#fbbf24', label: 'Due today' });
  });

  it('labels a card due soon in orange', () => {
    expect(getDueDateBadge(makeCard(2), false)).toEqual({ color: '#fb923c', label: '2d' });
  });

  it('labels a card due later in neutral grey', () => {
    expect(getDueDateBadge(makeCard(30), false)).toEqual({ color: '#555568', label: '30d' });
  });

  it('drops overdue framing for a past-due card on a done column, keeping the date', () => {
    const card = createMockCard({ due_date: '2020-01-01' });
    expect(getDueDateBadge(card, true)).toEqual({ color: '#555568', label: 'Jan 1' });
  });

  it('drops due-today framing on a done column', () => {
    expect(getDueDateBadge(makeCard(0), true)?.color).toEqual('#555568');
  });

  it('returns null on a done column when the card has no due date', () => {
    expect(getDueDateBadge(makeCard(null), true)).toBeNull();
  });
});
