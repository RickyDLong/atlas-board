import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarView } from './CalendarView';
import { mockCards, mockCategories, mockColumns, createMockCard } from '@/__tests__/fixtures';

describe('CalendarView', () => {
  const defaultProps = {
    cards: mockCards,
    categories: mockCategories,
    columns: mockColumns,
    onCardClick: vi.fn(),
    onAddCard: vi.fn(),
  };

  it('renders current month and year', () => {
    render(<CalendarView {...defaultProps} />);
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    expect(screen.getByText(`${monthNames[now.getMonth()]} ${now.getFullYear()}`)).toBeInTheDocument();
  });

  it('renders day name headers', () => {
    render(<CalendarView {...defaultProps} />);
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('renders Today button', () => {
    render(<CalendarView {...defaultProps} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('renders prev and next month buttons', () => {
    render(<CalendarView {...defaultProps} />);
    // ‹ and ›
    expect(screen.getByText('‹')).toBeInTheDocument();
    expect(screen.getByText('›')).toBeInTheDocument();
  });

  it('navigates to next month when › is clicked', () => {
    render(<CalendarView {...defaultProps} />);
    const now = new Date();
    const nextMonth = (now.getMonth() + 1) % 12;
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    fireEvent.click(screen.getByText('›'));

    const expectedYear = nextMonth === 0 ? now.getFullYear() + 1 : now.getFullYear();
    expect(screen.getByText(`${monthNames[nextMonth]} ${expectedYear}`)).toBeInTheDocument();
  });

  it('navigates to previous month when ‹ is clicked', () => {
    render(<CalendarView {...defaultProps} />);
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    fireEvent.click(screen.getByText('‹'));

    const expectedYear = prevMonth === 11 ? now.getFullYear() - 1 : now.getFullYear();
    expect(screen.getByText(`${monthNames[prevMonth]} ${expectedYear}`)).toBeInTheDocument();
  });

  it('renders "No Due Date" sidebar with count', () => {
    render(<CalendarView {...defaultProps} />);
    expect(screen.getByText('No Due Date')).toBeInTheDocument();
  });

  it('shows unscheduled cards in sidebar', () => {
    const unscheduledCards = mockCards.filter(c => !c.due_date);
    render(<CalendarView {...defaultProps} />);
    for (const card of unscheduledCards) {
      expect(screen.getByText(card.title)).toBeInTheDocument();
    }
  });

  it('renders cards on their due date in the calendar', () => {
    // Create a card due today so it appears in current month view
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayCard = createMockCard({ title: 'Due Today Card', due_date: todayStr });

    render(<CalendarView {...defaultProps} cards={[todayCard]} />);
    expect(screen.getByText('Due Today Card')).toBeInTheDocument();
  });

  it('calls onCardClick when a card is clicked', () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayCard = createMockCard({ title: 'Clickable Card', due_date: todayStr });
    const onCardClick = vi.fn();

    render(<CalendarView {...defaultProps} cards={[todayCard]} onCardClick={onCardClick} />);
    fireEvent.click(screen.getByText('Clickable Card'));
    expect(onCardClick).toHaveBeenCalledWith(todayCard);
  });

  it('shows "All cards have dates" when no unscheduled cards', () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const allScheduled = [createMockCard({ title: 'Scheduled', due_date: todayStr })];

    render(<CalendarView {...defaultProps} cards={allScheduled} />);
    expect(screen.getByText('All cards have dates')).toBeInTheDocument();
  });
});
