import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsModal } from './SettingsModal';
import { mockBoard, mockCategories, mockColumns } from '@/__tests__/fixtures';

describe('SettingsModal', () => {
  const defaultProps = {
    board: mockBoard,
    categories: mockCategories,
    columns: mockColumns,
    onAddCategory: vi.fn().mockResolvedValue(undefined),
    onEditCategory: vi.fn().mockResolvedValue(undefined),
    onRemoveCategory: vi.fn().mockResolvedValue(undefined),
    onAddColumn: vi.fn().mockResolvedValue(undefined),
    onEditColumn: vi.fn().mockResolvedValue(undefined),
    onRemoveColumn: vi.fn().mockResolvedValue(undefined),
    onReorderColumns: vi.fn().mockResolvedValue(undefined),
    onClose: vi.fn(),
  };

  it('renders "Board Settings" title', () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByText('Board Settings')).toBeInTheDocument();
  });

  it('renders Categories and Columns tabs', () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Columns')).toBeInTheDocument();
  });

  it('renders category labels on Categories tab', () => {
    render(<SettingsModal {...defaultProps} />);
    // Categories tab should be active by default
    for (const cat of mockCategories) {
      expect(screen.getByDisplayValue(cat.label)).toBeInTheDocument();
    }
  });

  it('renders "+ Add Category" button', () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByText('+ Add Category')).toBeInTheDocument();
  });

  it('switches to Columns tab', () => {
    render(<SettingsModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Columns'));
    for (const col of mockColumns) {
      expect(screen.getByDisplayValue(col.title)).toBeInTheDocument();
    }
  });

  it('renders "+ Add Column" button on Columns tab', () => {
    render(<SettingsModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Columns'));
    expect(screen.getByText('+ Add Column')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<SettingsModal {...defaultProps} onClose={onClose} />);
    // Multiple × buttons exist (close + delete per category). The first is the modal close.
    const closeButtons = screen.getAllByText('×');
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onAddCategory when "+ Add Category" is clicked', async () => {
    const onAddCategory = vi.fn().mockResolvedValue(undefined);
    render(<SettingsModal {...defaultProps} onAddCategory={onAddCategory} />);
    fireEvent.click(screen.getByText('+ Add Category'));
    expect(onAddCategory).toHaveBeenCalledOnce();
  });

  it('calls onRemoveCategory when delete button is clicked on a category', () => {
    const onRemoveCategory = vi.fn().mockResolvedValue(undefined);
    render(<SettingsModal {...defaultProps} onRemoveCategory={onRemoveCategory} />);
    // × buttons: first is modal close, rest are category deletes
    const allX = screen.getAllByText('×');
    // Skip first (modal close), click second (first category delete)
    fireEvent.click(allX[1]);
    expect(onRemoveCategory).toHaveBeenCalledWith(mockCategories[0].id);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<SettingsModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(container.firstChild as Element);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
