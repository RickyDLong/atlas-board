import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { BoardColumn } from './BoardColumn';
import { GamificationModeProvider } from '@/contexts/GamificationModeContext';
import { mockColumns, mockCards, mockCategories } from '@/__tests__/fixtures';

// BoardColumn reads useGamificationMode(), so every render needs the provider.
// userId=null keeps it in its default (gamified) state without any DB call.
const Wrapper = ({ children }: { children: ReactNode }) => (
  <GamificationModeProvider userId={null}>{children}</GamificationModeProvider>
);
const renderColumn = (ui: React.ReactElement) => render(ui, { wrapper: Wrapper });

describe('BoardColumn', () => {
  const column = mockColumns[0]; // Backlog ("Quest Log")
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
    renderColumn(<BoardColumn {...defaultProps} />);
    expect(screen.getByText('Quest Log')).toBeInTheDocument();
  });

  it('renders the card count', () => {
    renderColumn(<BoardColumn {...defaultProps} />);
    expect(screen.getByText(String(cardsInColumn.length))).toBeInTheDocument();
  });

  it('renders all cards in the column', () => {
    renderColumn(<BoardColumn {...defaultProps} />);
    for (const card of cardsInColumn) {
      expect(screen.getByText(card.title)).toBeInTheDocument();
    }
  });

  it('renders empty state when no cards', () => {
    renderColumn(<BoardColumn {...defaultProps} cards={[]} />);
    expect(screen.getByText('No quests here yet')).toBeInTheDocument();
  });

  it('calls onAddCard with column id when Add button is clicked', () => {
    const onAddCard = vi.fn();
    renderColumn(<BoardColumn {...defaultProps} onAddCard={onAddCard} />);
    fireEvent.click(screen.getByText('+ Add'));
    expect(onAddCard).toHaveBeenCalledWith(column.id);
  });

  it('renders card count as 0 for empty column', () => {
    renderColumn(<BoardColumn {...defaultProps} cards={[]} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
