import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LevelUpCelebration } from './LevelUpCelebration';

describe('LevelUpCelebration', () => {
  const defaultProps = {
    level: 13,
    title: 'Specialist',
    color: '#4a9eff',
    onComplete: vi.fn(),
  };

  it('renders the level number', () => {
    render(<LevelUpCelebration {...defaultProps} />);
    expect(screen.getByText('13')).toBeInTheDocument();
  });

  it('renders the title', () => {
    render(<LevelUpCelebration {...defaultProps} />);
    expect(screen.getByText('Specialist')).toBeInTheDocument();
  });

  it('renders Level Up text', () => {
    render(<LevelUpCelebration {...defaultProps} />);
    expect(screen.getByText('Level Up')).toBeInTheDocument();
  });

  it('generates particles', () => {
    const { container } = render(<LevelUpCelebration {...defaultProps} />);
    // Should have particle elements (rounded-full absolute divs)
    const particles = container.querySelectorAll('.absolute.rounded-full');
    expect(particles.length).toBeGreaterThan(0);
  });

  it('calls onComplete after animation', () => {
    vi.useFakeTimers();
    render(<LevelUpCelebration {...defaultProps} />);
    vi.advanceTimersByTime(3500);
    expect(defaultProps.onComplete).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
