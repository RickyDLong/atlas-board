-- Labels table
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8888a0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_labels_board ON labels(board_id);

-- Many-to-many junction
CREATE TABLE IF NOT EXISTS card_labels (
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

CREATE INDEX idx_card_labels_card ON card_labels(card_id);
CREATE INDEX idx_card_labels_label ON card_labels(label_id);

-- RLS for labels
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own labels"
  ON labels FOR SELECT
  USING (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own labels"
  ON labels FOR INSERT
  WITH CHECK (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own labels"
  ON labels FOR UPDATE
  USING (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own labels"
  ON labels FOR DELETE
  USING (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

-- RLS for card_labels
ALTER TABLE card_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their card labels"
  ON card_labels FOR SELECT
  USING (card_id IN (SELECT id FROM cards WHERE board_id IN (SELECT id FROM boards WHERE user_id = auth.uid())));

CREATE POLICY "Users can insert their card labels"
  ON card_labels FOR INSERT
  WITH CHECK (card_id IN (SELECT id FROM cards WHERE board_id IN (SELECT id FROM boards WHERE user_id = auth.uid())));

CREATE POLICY "Users can delete their card labels"
  ON card_labels FOR DELETE
  USING (card_id IN (SELECT id FROM cards WHERE board_id IN (SELECT id FROM boards WHERE user_id = auth.uid())));
