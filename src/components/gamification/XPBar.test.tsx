import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { XPBar } from './XPBar';
import { mockUserLevel, mockUserStreak } from '@/__tests__/fixtures';

describe('XPBar', () => {
  const defaultProps = {
    level: mockUserLevel,
    streak: mockUserStreak,
    levelProgress: 0.65,
    xpInCurrentLevel: 650,
    xpNeededForNext: 1000,
    levelColor: '#4a9eff',
    badgeCount: 3,
    onClickStats: vi.fn(),
  };

  it('renders level number', () => {
    render(<XPBar {...defaultProps} />);
    expect(screen.getByText('Lv.12')).toBeInTheDocument();
  });

  it('renders level title', () => {
    render(<XPBar {...defaultProps} />);
    expect(screen.getByText('Specialist')).toBeInTheDocument();
  });

  it('renders XP progress text', () => {
    render(<XPBar {...defaultProps} />);
    expect(screen.getByText('650/1000')).toBeInTheDocument();
  });

  it('renders streak count when active', () => {
    render(<XPBar {...defaultProps} />);
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('does not render streak when streak is 0', () => {
    const noStreak = { ...mockUserStreak, current_streak: 0 };
    render(<XPBar {...defaultProps} streak={noStreak} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders badge count', () => {
    render(<XPBar {...defaultProps} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not render badge count when 0', () => {
    render(<XPBar {...defaultProps} badgeCount={0} />);
    // Badge section should not render when count is 0
    expect(screen.queryByText('\u{1F3C6}')).not.toBeInTheDocument();
  });

  it('calls onClickStats when clicked', () => {
    render(<XPBar {...defaultProps} />);
    fireEvent.click(screen.getByText('Lv.12').closest('button')!);
    expect(defaultProps.onClickStats).toHaveBeenCalled();
  });

  it('renders nothing when level is null', () => {
    const { container } = render(<XPBar {...defaultProps} level={null} />);
    expect(container.innerHTML).toBe('');
  });
});
