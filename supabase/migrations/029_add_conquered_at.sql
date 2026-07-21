-- Track when a card was moved into a done (Conquered) column.
-- Set fresh on every entry into a done column and cleared on exit, so only the
-- newest completion time is ever kept (application logic in useBoard.moveCardToColumn).
ALTER TABLE cards ADD COLUMN IF NOT EXISTS conquered_at timestamptz;

-- Backfill cards already sitting in a done column, using the latest transition
-- INTO that column from the existing audit table (014_column_transitions.sql).
UPDATE cards c
SET conquered_at = ct.transitioned_at
FROM (
  SELECT DISTINCT ON (card_id) card_id, to_column_id, transitioned_at
  FROM column_transitions
  ORDER BY card_id, transitioned_at DESC
) ct
JOIN columns col ON col.id = ct.to_column_id AND col.is_done = true
WHERE c.id = ct.card_id AND c.column_id = ct.to_column_id;
