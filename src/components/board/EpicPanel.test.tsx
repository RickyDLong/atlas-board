import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EpicPanel } from './EpicPanel';
import { mockEpics, mockCards, mockColumns } from '@/__tests__/fixtures';
import type { Epic } from '@/types/database';

describe('EpicPanel', () => {
  const mockNewEpic: Epic = {
    id: 'new-epic', board_id: 'board-1', name: 'New Epic', description: null,
    color: '#4a9eff', status: 'active', target_date: null, archived_at: null,
    created_at: '2026-04-01T00:00:00Z', updated_at: '2026-04-01T00:00:00Z',
  };

  const defaultProps = {
    boardId: 'board-1',
    epics: mockEpics,
    cards: mockCards,
    columns: mockColumns,
    selectedEpicId: null,
    onSelectEpic: vi.fn(),
    onAddEpic: vi.fn().mockResolvedValue(mockNewEpic),
    onEditEpic: vi.fn().mockResolvedValue(undefined),
    onRemoveEpic: vi.fn().mockResolvedValue(undefined),
    onArchiveEpic: vi.fn().mockResolvedValue(undefined),
    onClose: vi.fn(),
  };

  describe('epic list view', () => {
    it('renders "Epics" title', () => {
      render(<EpicPanel {...defaultProps} />);
      expect(screen.getByText('Epics')).toBeInTheDocument();
    });

    it('renders all epic names', () => {
      render(<EpicPanel {...defaultProps} />);
      expect(screen.getByText('Atlas Board')).toBeInTheDocument();
      expect(screen.getByText('KDP Publishing')).toBeInTheDocument();
    });

    it('renders "+ New Epic" button', () => {
      render(<EpicPanel {...defaultProps} />);
      expect(screen.getByText('+ New Epic')).toBeInTheDocument();
    });

    it('calls onClose when × is clicked', () => {
      const onClose = vi.fn();
      render(<EpicPanel {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText('×'));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onSelectEpic when an epic card is clicked', () => {
      const onSelectEpic = vi.fn();
      render(<EpicPanel {...defaultProps} onSelectEpic={onSelectEpic} />);
      fireEvent.click(screen.getByText('Atlas Board'));
      expect(onSelectEpic).toHaveBeenCalledWith('epic-1');
    });

    it('shows empty state when no epics', () => {
      render(<EpicPanel {...defaultProps} epics={[]} />);
      expect(screen.getByText(/No epics yet/)).toBeInTheDocument();
    });

    it('renders epic status badges', () => {
      render(<EpicPanel {...defaultProps} />);
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Planning')).toBeInTheDocument();
    });
  });

  describe('epic detail view', () => {
    it('renders epic name as title when selected', () => {
      render(<EpicPanel {...defaultProps} selectedEpicId="epic-1" />);
      // Should show the epic name in the header
      expect(screen.getByText('Atlas Board')).toBeInTheDocument();
    });

    it('renders back arrow when epic is selected', () => {
      render(<EpicPanel {...defaultProps} selectedEpicId="epic-1" />);
      expect(screen.getByText('←')).toBeInTheDocument();
    });

    it('renders Delete Epic button in detail view', () => {
      render(<EpicPanel {...defaultProps} selectedEpicId="epic-1" />);
      expect(screen.getByText('Delete Epic')).toBeInTheDocument();
    });

    it('renders Archive Epic + Cards button when onArchiveEpic provided', () => {
      render(<EpicPanel {...defaultProps} selectedEpicId="epic-1" />);
      expect(screen.getByText('Archive Epic + Cards')).toBeInTheDocument();
    });

    it('does not render archive button when onArchiveEpic is undefined', () => {
      render(<EpicPanel {...defaultProps} selectedEpicId="epic-1" onArchiveEpic={undefined} />);
      expect(screen.queryByText('Archive Epic + Cards')).not.toBeInTheDocument();
    });

    it('renders Edit button in detail view', () => {
      render(<EpicPanel {...defaultProps} selectedEpicId="epic-1" />);
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('calls onRemoveEpic when Delete Epic is clicked', async () => {
      const onRemoveEpic = vi.fn().mockResolvedValue(undefined);
      render(<EpicPanel {...defaultProps} selectedEpicId="epic-1" onRemoveEpic={onRemoveEpic} />);
      fireEvent.click(screen.getByText('Delete Epic'));
      await waitFor(() => {
        expect(onRemoveEpic).toHaveBeenCalledWith('epic-1');
      });
    });

    it('calls onArchiveEpic when Archive Epic + Cards is clicked', async () => {
      const onArchiveEpic = vi.fn().mockResolvedValue(undefined);
      render(<EpicPanel {...defaultProps} selectedEpicId="epic-1" onArchiveEpic={onArchiveEpic} />);
      fireEvent.click(screen.getByText('Archive Epic + Cards'));
      await waitFor(() => {
        expect(onArchiveEpic).toHaveBeenCalledWith('epic-1');
      });
    });

    it('calls onSelectEpic(null) when back arrow is clicked', () => {
      const onSelectEpic = vi.fn();
      render(<EpicPanel {...defaultProps} selectedEpicId="epic-1" onSelectEpic={onSelectEpic} />);
      fireEvent.click(screen.getByText('←'));
      expect(onSelectEpic).toHaveBeenCalledWith(null);
    });

    it('renders description when epic has one', () => {
      render(<EpicPanel {...defaultProps} selectedEpicId="epic-1" />);
      expect(screen.getByText('Build the kanban board')).toBeInTheDocument();
    });

    it('lists cards belonging to the selected epic', () => {
      render(<EpicPanel {...defaultProps} selectedEpicId="epic-1" />);
      // Cards with epic_id = 'epic-1': card-1 (Add dark mode), card-3 (Setup project)
      expect(screen.getByText('Add dark mode')).toBeInTheDocument();
      expect(screen.getByText('Setup project')).toBeInTheDocument();
    });
  });
});
