import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardModal } from './CardModal';
import { mockCards, mockColumns, mockCategories, mockEpics } from '@/__tests__/fixtures';

describe('CardModal', () => {
  const defaultProps = {
    card: null,
    boardId: 'board-1',
    defaultColumnId: 'col-backlog',
    categories: mockCategories,
    columns: mockColumns,
    epics: mockEpics,
    nextPosition: 3,
    onSave: vi.fn().mockResolvedValue(undefined),
    onClose: vi.fn(),
  };

  describe('create mode', () => {
    it('renders "New Project" title when card is null', () => {
      render(<CardModal {...defaultProps} />);
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    it('renders "Create" button for new card', () => {
      render(<CardModal {...defaultProps} />);
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(<CardModal {...defaultProps} />);
      expect(screen.getByPlaceholderText('Name your quest...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Brief description or goal...')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Effort')).toBeInTheDocument();
      expect(screen.getByText('Epic')).toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', () => {
      const onClose = vi.fn();
      render(<CardModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when × is clicked', () => {
      const onClose = vi.fn();
      render(<CardModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText('×'));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('pre-fills due date from defaultDueDate prop', () => {
      render(<CardModal {...defaultProps} defaultDueDate="2026-05-01" />);
      const dateInput = screen.getByDisplayValue('2026-05-01');
      expect(dateInput).toBeInTheDocument();
    });

    it('calls onSave with form data on submit', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<CardModal {...defaultProps} onSave={onSave} />);

      await user.type(screen.getByPlaceholderText('Name your quest...'), 'New feature');
      await user.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledOnce();
      });

      const savedData = onSave.mock.calls[0][0];
      expect(savedData.title).toBe('New feature');
      expect(savedData.board_id).toBe('board-1');
      expect(savedData.position).toBe(3); // nextPosition
    });
  });

  describe('edit mode', () => {
    const editCard = mockCards[0]; // 'Add dark mode'

    it('renders "Edit Project" title when card is provided', () => {
      render(<CardModal {...defaultProps} card={editCard} />);
      expect(screen.getByText('Edit Project')).toBeInTheDocument();
    });

    it('renders "Save" button for editing', () => {
      render(<CardModal {...defaultProps} card={editCard} />);
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('pre-fills form with card data', () => {
      render(<CardModal {...defaultProps} card={editCard} />);
      expect(screen.getByDisplayValue('Add dark mode')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Implement theme toggle')).toBeInTheDocument();
    });

    it('pre-fills due date from card', () => {
      render(<CardModal {...defaultProps} card={editCard} />);
      expect(screen.getByDisplayValue('2026-04-15')).toBeInTheDocument();
    });
  });
});
