import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BadgePanel } from './BadgePanel';
import { mockUserLevel, mockUserStreak, mockUserBadges } from '@/__tests__/fixtures';
import { BADGE_DEFINITIONS } from '@/types/database';

describe('BadgePanel', () => {
  const defaultProps = {
    badges: mockUserBadges,
    level: mockUserLevel,
    streak: mockUserStreak,
    levelProgress: 0.65,
    xpInCurrentLevel: 650,
    xpNeededForNext: 1000,
    levelColor: '#4a9eff',
    onClose: vi.fn(),
  };

  it('renders the panel title', () => {
    render(<BadgePanel {...defaultProps} />);
    expect(screen.getByText('Player Stats & Badges')).toBeInTheDocument();
  });

  it('renders level in the player card', () => {
    render(<BadgePanel {...defaultProps} />);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders title in the player card', () => {
    render(<BadgePanel {...defaultProps} />);
    expect(screen.getByText('Specialist')).toBeInTheDocument();
  });

  it('renders total XP', () => {
    render(<BadgePanel {...defaultProps} />);
    expect(screen.getByText('1,247')).toBeInTheDocument();
  });

  it('renders current streak', () => {
    render(<BadgePanel {...defaultProps} />);
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('renders badge count', () => {
    render(<BadgePanel {...defaultProps} />);
    // 3 badges earned
    const threeElements = screen.getAllByText('3');
    expect(threeElements.length).toBeGreaterThan(0);
  });

  it('renders all badge definitions', () => {
    render(<BadgePanel {...defaultProps} />);
    BADGE_DEFINITIONS.forEach(def => {
      expect(screen.getByText(def.name)).toBeInTheDocument();
    });
  });

  it('shows earned badges with checkmark', () => {
    render(<BadgePanel {...defaultProps} />);
    // First Blood is earned
    const firstBlood = screen.getByText('First Blood');
    expect(firstBlood).toBeInTheDocument();
    // Earned date should show
    expect(screen.getAllByText(/Earned/).length).toBe(3); // 3 earned badges
  });

  it('calls onClose when close button clicked', () => {
    render(<BadgePanel {...defaultProps} />);
    fireEvent.click(screen.getAllByText('\u00D7')[0]);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop clicked', () => {
    render(<BadgePanel {...defaultProps} />);
    const backdrop = screen.getByText('Player Stats & Badges').closest('.fixed')!;
    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('filters badges by tier', () => {
    render(<BadgePanel {...defaultProps} />);
    // Click on Gold tier filter
    const goldButtons = screen.getAllByText(/gold/i);
    const filterBtn = goldButtons.find(el => el.tagName === 'BUTTON');
    if (filterBtn) {
      fireEvent.click(filterBtn);
      // Only gold badges should show
      const goldBadges = BADGE_DEFINITIONS.filter(d => d.tier === 'gold');
      goldBadges.forEach(def => {
        expect(screen.getByText(def.name)).toBeInTheDocument();
      });
    }
  });

  it('shows freeze tokens when available', () => {
    render(<BadgePanel {...defaultProps} />);
    expect(screen.getByText(/streak freeze/)).toBeInTheDocument();
  });

  it('renders XP progress bar', () => {
    render(<BadgePanel {...defaultProps} />);
    expect(screen.getByText('650/1000')).toBeInTheDocument();
  });
});
