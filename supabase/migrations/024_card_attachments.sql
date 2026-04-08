-- Card attachments metadata
CREATE TABLE IF NOT EXISTS card_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_card_attachments_card ON card_attachments(card_id);
CREATE INDEX idx_card_attachments_board ON card_attachments(board_id);

ALTER TABLE card_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments on their boards"
  ON card_attachments FOR SELECT
  USING (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert attachments on their boards"
  ON card_attachments FOR INSERT
  WITH CHECK (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own attachments"
  ON card_attachments FOR DELETE
  USING (user_id = auth.uid());
