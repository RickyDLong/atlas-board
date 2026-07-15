import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakCalendar } from './StreakCalendar';

// Mock the gamification-actions module
vi.mock('@/lib/gamification-actions', () => ({
  getXPEventsByDay: vi.fn().mockResolvedValue({
    '2026-04-01': 150,
    '2026-04-02': 50,
    '2026-04-03': 200,
    '2026-04-04': 0,
    '2026-04-05': 75,
    '2026-04-06': 100,
  }),
}));

describe('StreakCalendar', () => {
  it('renders the calendar grid', () => {
    const { container } = render(<StreakCalendar userId="user-1" />);
    // Should have cell divs (w-3 h-3)
    const cells = container.querySelectorAll('.w-3.h-3');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('renders day labels', () => {
    render(<StreakCalendar userId="user-1" />);
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
  });

  it('renders without crashing when userId is null', () => {
    const { container } = render(<StreakCalendar userId={null} />);
    // Should still render the grid structure
    const cells = container.querySelectorAll('.w-3.h-3');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('renders correct number of weeks', () => {
    const { container } = render(<StreakCalendar userId="user-1" />);
    // 20 weeks of 7 days = 140 cells
    const cells = container.querySelectorAll('.w-3.h-3');
    expect(cells.length).toBe(140);
  });
});
