import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArchivePanel } from './ArchivePanel';
import { mockCategories } from '@/__tests__/fixtures';

// Use vi.hoisted to ensure the mock data is available when vi.mock runs
const { mockGetArchivedCards } = vi.hoisted(() => {
  const mockGetArchivedCards = vi.fn().mockResolvedValue([
    {
      id: 'archived-1', board_id: 'board-1', column_id: 'col-done', category_id: 'cat-side',
      epic_id: null, title: 'Archived Card 1', description: 'First archived card',
      priority: 'high' as const, effort: null, notes: null, due_date: null,
      archived_at: '2026-03-15T00:00:00Z', position: 0,
      created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-15T00:00:00Z',
    },
    {
      id: 'archived-2', board_id: 'board-1', column_id: 'col-done', category_id: 'cat-career',
      epic_id: null, title: 'Archived Card 2', description: 'Second archived card',
      priority: 'medium' as const, effort: null, notes: null, due_date: null,
      archived_at: '2026-03-10T00:00:00Z', position: 0,
      created_at: '2026-02-01T00:00:00Z', updated_at: '2026-03-10T00:00:00Z',
    },
  ]);
  return { mockGetArchivedCards };
});

vi.mock('@/lib/board-actions', async () => {
  const actual = await vi.importActual('@/lib/board-actions');
  return {
    ...actual,
    getArchivedCards: mockGetArchivedCards,
  };
});

describe('ArchivePanel', () => {
  const defaultProps = {
    boardId: 'board-1',
    categories: mockCategories,
    onRestore: vi.fn().mockResolvedValue(undefined),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetArchivedCards.mockResolvedValue([
      {
        id: 'archived-1', board_id: 'board-1', column_id: 'col-done', category_id: 'cat-side',
        epic_id: null, title: 'Archived Card 1', description: 'First archived card',
        priority: 'high' as const, effort: null, notes: null, due_date: null,
        archived_at: '2026-03-15T00:00:00Z', position: 0,
        created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-15T00:00:00Z',
      },
      {
        id: 'archived-2', board_id: 'board-1', column_id: 'col-done', category_id: 'cat-career',
        epic_id: null, title: 'Archived Card 2', description: 'Second archived card',
        priority: 'medium' as const, effort: null, notes: null, due_date: null,
        archived_at: '2026-03-10T00:00:00Z', position: 0,
        created_at: '2026-02-01T00:00:00Z', updated_at: '2026-03-10T00:00:00Z',
      },
    ]);
  });

  it('renders the Archive title', async () => {
    render(<ArchivePanel {...defaultProps} />);
    expect(screen.getByText('Archive')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<ArchivePanel {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search archived cards...')).toBeInTheDocument();
  });

  it('renders archived cards after loading', async () => {
    render(<ArchivePanel {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Archived Card 1')).toBeInTheDocument();
      expect(screen.getByText('Archived Card 2')).toBeInTheDocument();
    });
  });

  it('shows card count after loading', async () => {
    render(<ArchivePanel {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('2 cards')).toBeInTheDocument();
    });
  });

  it('renders Restore button for each card', async () => {
    render(<ArchivePanel {...defaultProps} />);
    await waitFor(() => {
      const restoreButtons = screen.getAllByText('Restore');
      expect(restoreButtons).toHaveLength(2);
    });
  });

  it('calls onRestore when Restore is clicked', async () => {
    const onRestore = vi.fn().mockResolvedValue(undefined);
    render(<ArchivePanel {...defaultProps} onRestore={onRestore} />);

    await waitFor(() => {
      expect(screen.getByText('Archived Card 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Restore')[0]);

    await waitFor(() => {
      expect(onRestore).toHaveBeenCalledOnce();
    });
  });

  it('calls onClose when × is clicked', async () => {
    const onClose = vi.fn();
    render(<ArchivePanel {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<ArchivePanel {...defaultProps} onClose={onClose} />);
    fireEvent.click(container.firstChild as Element);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('filters cards by search query', async () => {
    const user = userEvent.setup();
    render(<ArchivePanel {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Archived Card 1')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Search archived cards...'), 'Card 1');

    expect(screen.getByText('Archived Card 1')).toBeInTheDocument();
    expect(screen.queryByText('Archived Card 2')).not.toBeInTheDocument();
  });

  it('shows "No matches found" when search has no results', async () => {
    const user = userEvent.setup();
    render(<ArchivePanel {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Archived Card 1')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Search archived cards...'), 'nonexistent');

    expect(screen.getByText('No matches found')).toBeInTheDocument();
  });

  it('renders card descriptions', async () => {
    render(<ArchivePanel {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('First archived card')).toBeInTheDocument();
    });
  });

  it('shows empty archive state', async () => {
    mockGetArchivedCards.mockResolvedValue([]);
    render(<ArchivePanel {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Archive is empty')).toBeInTheDocument();
    });
  });
});
