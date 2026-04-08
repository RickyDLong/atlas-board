-- Saved filter presets
CREATE TABLE IF NOT EXISTS saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_filters_board ON saved_filters(board_id);

ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own filters"
  ON saved_filters FOR SELECT
  USING (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own filters"
  ON saved_filters FOR INSERT
  WITH CHECK (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own filters"
  ON saved_filters FOR UPDATE
  USING (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own filters"
  ON saved_filters FOR DELETE
  USING (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));
