-- Column transition log for cycle time metrics
CREATE TABLE IF NOT EXISTS column_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  from_column_id UUID REFERENCES columns(id) ON DELETE SET NULL,
  to_column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  transitioned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_column_transitions_card ON column_transitions(card_id);
CREATE INDEX idx_column_transitions_board ON column_transitions(board_id);
CREATE INDEX idx_column_transitions_time ON column_transitions(transitioned_at);

-- RLS
ALTER TABLE column_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transitions"
  ON column_transitions FOR SELECT
  USING (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own transitions"
  ON column_transitions FOR INSERT
  WITH CHECK (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

-- Trigger function: auto-log column changes
CREATE OR REPLACE FUNCTION log_column_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.column_id IS DISTINCT FROM NEW.column_id THEN
    INSERT INTO column_transitions (card_id, board_id, from_column_id, to_column_id, transitioned_at)
    VALUES (NEW.id, NEW.board_id, OLD.column_id, NEW.column_id, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_column_transition
  AFTER UPDATE OF column_id ON cards
  FOR EACH ROW
  EXECUTE FUNCTION log_column_transition();
