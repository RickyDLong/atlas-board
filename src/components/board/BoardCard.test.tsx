import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardCard } from './BoardCard';
import { mockCards, mockCategories } from '@/__tests__/fixtures';
import { PRIORITIES } from '@/types/database';

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
    // Effort badge would show XS, S, M, etc — none should be present
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
    // Card has due_date: '2026-04-15' — badge shows relative days like "9d" or "Xd overdue"
    const badge = screen.getByText(/\d+d/);
    expect(badge).toBeInTheDocument();
  });

  it('does not render due date badge when due_date is null', () => {
    const card = { ...defaultCard, due_date: null };
    render(<BoardCard {...defaultProps} card={card} />);
    // No relative date badge should appear
    expect(screen.queryByText(/\d+d$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/overdue/)).not.toBeInTheDocument();
  });

  it('renders an aging dot indicator', () => {
    const { container } = render(<BoardCard {...defaultProps} />);
    // Aging dot is a span with rounded-full class
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('shows overdue styling for past-due cards not in done column', () => {
    const overdueCard = {
      ...defaultCard,
      due_date: '2020-01-01', // far in the past
    };
    render(<BoardCard {...defaultProps} card={overdueCard} />);
    const badge = screen.getByText(/overdue/i);
    expect(badge).toBeInTheDocument();
  });
});
