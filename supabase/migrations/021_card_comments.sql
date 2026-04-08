-- Threaded comments on cards
CREATE TABLE IF NOT EXISTS card_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES card_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_card_comments_card ON card_comments(card_id);
CREATE INDEX idx_card_comments_parent ON card_comments(parent_id);

ALTER TABLE card_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on their boards"
  ON card_comments FOR SELECT
  USING (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert comments on their boards"
  ON card_comments FOR INSERT
  WITH CHECK (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own comments"
  ON card_comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON card_comments FOR DELETE
  USING (user_id = auth.uid());
