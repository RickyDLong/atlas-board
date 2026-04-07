-- Track when a card was last moved to a different column
ALTER TABLE cards ADD COLUMN IF NOT EXISTS column_changed_at timestamptz DEFAULT now();

-- Backfill: set existing cards' column_changed_at to their updated_at as best approximation
UPDATE cards SET column_changed_at = updated_at WHERE column_changed_at IS NULL;

-- Index for efficient aging queries
CREATE INDEX IF NOT EXISTS idx_cards_column_changed ON cards(column_changed_at);
