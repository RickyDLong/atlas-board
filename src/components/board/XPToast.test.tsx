import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { XPToastStack } from './XPToast';
import type { XPToast } from '@/hooks/useGamification';

describe('XPToastStack', () => {
  const mockToasts: XPToast[] = [
    {
      id: '1',
      xp: 25,
      action: 'card_complete',
      leveledUp: false,
      newBadges: [],
    },
  ];

  const onDismiss = vi.fn();

  it('renders nothing when toasts is empty', () => {
    const { container } = render(<XPToastStack toasts={[]} onDismiss={onDismiss} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders XP amount', () => {
    render(<XPToastStack toasts={mockToasts} onDismiss={onDismiss} />);
    expect(screen.getByText('+25')).toBeInTheDocument();
  });

  it('renders action label', () => {
    render(<XPToastStack toasts={mockToasts} onDismiss={onDismiss} />);
    expect(screen.getByText('Card Completed')).toBeInTheDocument();
  });

  it('shows level-up text when leveled up', () => {
    const levelUpToast: XPToast[] = [{
      id: '2',
      xp: 50,
      action: 'card_complete_high',
      leveledUp: true,
      newLevel: 13,
      newTitle: 'Specialist',
      newBadges: [],
    }];
    render(<XPToastStack toasts={levelUpToast} onDismiss={onDismiss} />);
    expect(screen.getByText('Level Up! Lv.13 Specialist')).toBeInTheDocument();
  });

  it('shows new badge names', () => {
    const badgeToast: XPToast[] = [{
      id: '3',
      xp: 25,
      action: 'card_complete',
      leveledUp: false,
      newBadges: ['\u{1F5E1} First Blood'],
    }];
    render(<XPToastStack toasts={badgeToast} onDismiss={onDismiss} />);
    expect(screen.getByText('\u{1F5E1} First Blood')).toBeInTheDocument();
  });

  it('calls onDismiss when clicked', () => {
    render(<XPToastStack toasts={mockToasts} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('+25').closest('div[class*="cursor-pointer"]')!);
    expect(onDismiss).toHaveBeenCalledWith('1');
  });

  it('renders multiple toasts', () => {
    const multi: XPToast[] = [
      { id: '1', xp: 25, action: 'card_complete', leveledUp: false, newBadges: [] },
      { id: '2', xp: 5, action: 'card_create', leveledUp: false, newBadges: [] },
    ];
    render(<XPToastStack toasts={multi} onDismiss={onDismiss} />);
    expect(screen.getByText('+25')).toBeInTheDocument();
    expect(screen.getByText('+5')).toBeInTheDocument();
  });
});
