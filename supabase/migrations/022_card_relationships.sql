-- Card relationships (blocked by / blocks / related to)
CREATE TABLE IF NOT EXISTS card_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  source_card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  target_card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('blocks', 'related_to', 'duplicates')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_card_id, target_card_id, relationship_type)
);

CREATE INDEX idx_card_relationships_source ON card_relationships(source_card_id);
CREATE INDEX idx_card_relationships_target ON card_relationships(target_card_id);
CREATE INDEX idx_card_relationships_board ON card_relationships(board_id);

ALTER TABLE card_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relationships on their boards"
  ON card_relationships FOR SELECT
  USING (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert relationships on their boards"
  ON card_relationships FOR INSERT
  WITH CHECK (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete relationships on their boards"
  ON card_relationships FOR DELETE
  USING (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));
