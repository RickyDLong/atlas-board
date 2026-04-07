import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsView } from './StatsView';
import { mockCards, mockCategories, mockColumns, mockEpics } from '@/__tests__/fixtures';

describe('StatsView', () => {
  const defaultProps = {
    cards: mockCards,
    categories: mockCategories,
    columns: mockColumns,
    epics: mockEpics,
  };

  it('renders top-level metric labels', () => {
    render(<StatsView {...defaultProps} />);
    expect(screen.getByText('Total Cards')).toBeInTheDocument();
    // "Active" may appear in both stat card and epic status — use getAllByText
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
    // "Done" appears as stat label and column name
    expect(screen.getAllByText('Done').length).toBeGreaterThan(0);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Due This Week')).toBeInTheDocument();
    expect(screen.getByText('Avg Age')).toBeInTheDocument();
  });

  it('displays correct total card count', () => {
    render(<StatsView {...defaultProps} />);
    expect(screen.getByText(String(mockCards.length))).toBeInTheDocument();
  });

  it('calculates done cards correctly', () => {
    const doneCards = mockCards.filter(c => c.column_id === 'col-done');
    render(<StatsView {...defaultProps} />);
    // Done count appears — may match multiple elements (stat + bar chart value)
    expect(screen.getAllByText(String(doneCards.length)).length).toBeGreaterThan(0);
  });

  it('renders section headers for chart areas', () => {
    render(<StatsView {...defaultProps} />);
    expect(screen.getByText('Cards by Status')).toBeInTheDocument();
    expect(screen.getByText('Cards by Priority')).toBeInTheDocument();
    expect(screen.getByText('Cards by Category')).toBeInTheDocument();
    expect(screen.getByText('Epic Progress')).toBeInTheDocument();
  });

  it('renders column names in Cards by Status', () => {
    render(<StatsView {...defaultProps} />);
    // Column names appear as bar labels — some may have duplicates from other sections
    for (const col of mockColumns) {
      expect(screen.getAllByText(col.title).length).toBeGreaterThan(0);
    }
  });

  it('renders priority names in Cards by Priority', () => {
    render(<StatsView {...defaultProps} />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders category names in Cards by Category', () => {
    render(<StatsView {...defaultProps} />);
    expect(screen.getByText('Side Projects')).toBeInTheDocument();
    expect(screen.getByText('Career')).toBeInTheDocument();
  });

  it('renders epic names in Epic Progress', () => {
    render(<StatsView {...defaultProps} />);
    expect(screen.getByText('Atlas Board')).toBeInTheDocument();
    expect(screen.getByText('KDP Publishing')).toBeInTheDocument();
  });

  it('shows "No active epics" when no epics exist', () => {
    render(<StatsView {...defaultProps} epics={[]} />);
    expect(screen.getByText('No active epics')).toBeInTheDocument();
  });

  it('renders Needs Attention section when cards lack due dates', () => {
    const noDueDateCards = mockCards.filter(c => !c.due_date && c.column_id !== 'col-done');
    if (noDueDateCards.length > 0) {
      render(<StatsView {...defaultProps} />);
      expect(screen.getByText('Needs Attention')).toBeInTheDocument();
    }
  });

  it('does not render Needs Attention when all active cards have due dates', () => {
    const allDated = mockCards.map(c => ({ ...c, due_date: '2026-05-01' }));
    render(<StatsView {...defaultProps} cards={allDated} />);
    expect(screen.queryByText('Needs Attention')).not.toBeInTheDocument();
  });

  it('renders zero state gracefully with no cards', () => {
    render(<StatsView {...defaultProps} cards={[]} />);
    expect(screen.getByText('Total Cards')).toBeInTheDocument();
    // Multiple 0s appear across stat cards and bar charts
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('shows Uncategorized in category chart when cards have no category', () => {
    render(<StatsView {...defaultProps} />);
    // card-4 has no category
    expect(screen.getByText('Uncategorized')).toBeInTheDocument();
  });
});
