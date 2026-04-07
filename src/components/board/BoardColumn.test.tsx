import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardColumn } from './BoardColumn';
import { mockColumns, mockCards, mockCategories } from '@/__tests__/fixtures';

describe('BoardColumn', () => {
  const column = mockColumns[0]; // Backlog
  const cardsInColumn = mockCards.filter(c => c.column_id === column.id);

  const defaultProps = {
    column,
    cards: cardsInColumn,
    categories: mockCategories,
    columns: mockColumns,
    onAddCard: vi.fn(),
    onCardClick: vi.fn(),
    onCardMenu: vi.fn(),
    onDrop: vi.fn(),
  };

  it('renders the column title', () => {
    render(<BoardColumn {...defaultProps} />);
    expect(screen.getByText('Quest Log')).toBeInTheDocument();
  });

  it('renders the card count', () => {
    render(<BoardColumn {...defaultProps} />);
    expect(screen.getByText(String(cardsInColumn.length))).toBeInTheDocument();
  });

  it('renders all cards in the column', () => {
    render(<BoardColumn {...defaultProps} />);
    for (const card of cardsInColumn) {
      expect(screen.getByText(card.title)).toBeInTheDocument();
    }
  });

  it('renders empty state when no cards', () => {
    render(<BoardColumn {...defaultProps} cards={[]} />);
    expect(screen.getByText('No quests here yet')).toBeInTheDocument();
  });

  it('calls onAddCard with column id when Add button is clicked', () => {
    const onAddCard = vi.fn();
    render(<BoardColumn {...defaultProps} onAddCard={onAddCard} />);
    fireEvent.click(screen.getByText('+ Add'));
    expect(onAddCard).toHaveBeenCalledWith(column.id);
  });

  it('renders card count as 0 for empty column', () => {
    render(<BoardColumn {...defaultProps} cards={[]} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
