-- Add is_done flag to columns table
-- Replaces fragile "last column by position" heuristic for identifying the done column
ALTER TABLE columns ADD COLUMN IF NOT EXISTS is_done BOOLEAN DEFAULT false;

-- Set is_done = true for the last column (by position) per board for existing data
UPDATE columns c
SET is_done = true
FROM (
  SELECT id
  FROM columns c2
  WHERE c2.position = (SELECT MAX(position) FROM columns c3 WHERE c3.board_id = c2.board_id)
) AS done_cols
WHERE c.id = done_cols.id;
