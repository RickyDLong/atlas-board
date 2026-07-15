import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListView } from './ListView';
import { mockCards, mockCategories, mockColumns, mockEpics } from '@/__tests__/fixtures';

describe('ListView', () => {
  const defaultProps = {
    cards: mockCards,
    categories: mockCategories,
    columns: mockColumns,
    epics: mockEpics,
    onCardClick: vi.fn(),
  };

  it('renders table headers', () => {
    render(<ListView {...defaultProps} />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Effort')).toBeInTheDocument();
    expect(screen.getByText('Epic')).toBeInTheDocument();
    expect(screen.getByText('Due')).toBeInTheDocument();
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });

  it('renders all card titles', () => {
    render(<ListView {...defaultProps} />);
    for (const card of mockCards) {
      expect(screen.getByText(card.title)).toBeInTheDocument();
    }
  });

  it('renders category labels for cards with categories', () => {
    render(<ListView {...defaultProps} />);
    // Multiple cards may have the same category, use getAllByText
    expect(screen.getAllByText('Side Projects').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Career').length).toBeGreaterThan(0);
  });

  it('renders column status badges', () => {
    render(<ListView {...defaultProps} />);
    // Column names appear in both header and data rows
    expect(screen.getAllByText('Quest Log').length).toBeGreaterThan(0);
    expect(screen.getAllByText('In Battle').length).toBeGreaterThan(0);
  });

  it('calls onCardClick when a row is clicked', () => {
    const onCardClick = vi.fn();
    render(<ListView {...defaultProps} onCardClick={onCardClick} />);
    fireEvent.click(screen.getByText('Add dark mode'));
    expect(onCardClick).toHaveBeenCalledOnce();
    expect(onCardClick.mock.calls[0][0].id).toBe('card-1');
  });

  it('shows empty state when no cards', () => {
    render(<ListView {...defaultProps} cards={[]} />);
    expect(screen.getByText('No cards match your filters')).toBeInTheDocument();
  });

  it('sorts by priority by default (ascending)', () => {
    render(<ListView {...defaultProps} />);
    // Priority header should show active sort indicator
    const priorityHeader = screen.getByText('Priority');
    expect(priorityHeader.closest('th')?.textContent).toContain('▲');
  });

  it('toggles sort direction when same header clicked twice', () => {
    render(<ListView {...defaultProps} />);
    // Priority is the default sort — click the th to toggle to desc
    fireEvent.click(screen.getByText('Priority').closest('th')!);
    // Re-query after state update
    const priorityTh = screen.getByText('Priority').closest('th')!;
    expect(priorityTh.textContent).toContain('▼');
  });

  it('switches sort field when a different header is clicked', () => {
    render(<ListView {...defaultProps} />);
    fireEvent.click(screen.getByText('Title'));
    const titleHeader = screen.getByText('Title');
    expect(titleHeader.closest('th')?.textContent).toContain('▲');
    // Priority should no longer have indicator
    const priorityHeader = screen.getByText('Priority');
    expect(priorityHeader.closest('th')?.textContent).not.toContain('▲');
    expect(priorityHeader.closest('th')?.textContent).not.toContain('▼');
  });

  it('renders epic names for cards with epics', () => {
    render(<ListView {...defaultProps} />);
    // Atlas Board epic may appear multiple times (2 cards linked to it)
    expect(screen.getAllByText('Atlas Board').length).toBeGreaterThan(0);
  });

  it('renders dashes for cards without optional fields', () => {
    render(<ListView {...defaultProps} />);
    // card-4 has no category, no epic, no effort, no due date
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });
});
