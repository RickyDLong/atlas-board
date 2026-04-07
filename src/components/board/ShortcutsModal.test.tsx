import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShortcutsModal } from './ShortcutsModal';
import { SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

describe('ShortcutsModal', () => {
  it('renders the modal title', () => {
    render(<ShortcutsModal onClose={vi.fn()} />);
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('renders all shortcut descriptions', () => {
    render(<ShortcutsModal onClose={vi.fn()} />);
    for (const shortcut of SHORTCUTS) {
      expect(screen.getByText(shortcut.description)).toBeInTheDocument();
    }
  });

  it('renders all shortcut keys in kbd elements', () => {
    const { container } = render(<ShortcutsModal onClose={vi.fn()} />);
    const kbdElements = container.querySelectorAll('kbd');
    // SHORTCUTS keys + the "?" in the footer text = SHORTCUTS.length + 1
    expect(kbdElements.length).toBeGreaterThanOrEqual(SHORTCUTS.length);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ShortcutsModal onClose={onClose} />);
    fireEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<ShortcutsModal onClose={onClose} />);
    // Click the backdrop (outermost div)
    fireEvent.click(container.firstChild as Element);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when modal content is clicked', () => {
    const onClose = vi.fn();
    render(<ShortcutsModal onClose={onClose} />);
    // Click on the title text — should stop propagation
    fireEvent.click(screen.getByText('Keyboard Shortcuts'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
