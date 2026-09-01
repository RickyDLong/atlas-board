-- Card flags: named impediment markers (Jira-style flags).
-- A card can carry several distinct flags, e.g. "waiting on client", "needs review".
CREATE TABLE IF NOT EXISTS card_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#fbbf24',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(card_id, label)
);

CREATE INDEX idx_card_flags_card ON card_flags(card_id);
CREATE INDEX idx_card_flags_board ON card_flags(board_id);

ALTER TABLE card_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view flags on their boards"
  ON card_flags FOR SELECT
  USING (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert flags on their boards"
  ON card_flags FOR INSERT
  WITH CHECK (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete flags on their boards"
  ON card_flags FOR DELETE
  USING (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

-- Sync flag add/remove across open tabs, matching the other board tables.
alter publication supabase_realtime add table card_flags;
