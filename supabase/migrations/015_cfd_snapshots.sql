-- Daily column count snapshots for Cumulative Flow Diagram
CREATE TABLE IF NOT EXISTS cfd_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  column_counts JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(board_id, snapshot_date)
);

CREATE INDEX idx_cfd_snapshots_board_date ON cfd_snapshots(board_id, snapshot_date);

-- RLS
ALTER TABLE cfd_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own snapshots"
  ON cfd_snapshots FOR SELECT
  USING (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own snapshots"
  ON cfd_snapshots FOR INSERT
  WITH CHECK (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own snapshots"
  ON cfd_snapshots FOR UPDATE
  USING (board_id IN (SELECT id FROM boards WHERE user_id = auth.uid()));

-- Function to capture or update today's snapshot
CREATE OR REPLACE FUNCTION capture_cfd_snapshot(p_board_id UUID)
RETURNS void AS $$
DECLARE
  counts JSONB;
BEGIN
  SELECT jsonb_object_agg(column_id, cnt)
  INTO counts
  FROM (
    SELECT column_id, COUNT(*)::int AS cnt
    FROM cards
    WHERE board_id = p_board_id AND archived_at IS NULL
    GROUP BY column_id
  ) sub;

  INSERT INTO cfd_snapshots (board_id, snapshot_date, column_counts)
  VALUES (p_board_id, CURRENT_DATE, COALESCE(counts, '{}'::jsonb))
  ON CONFLICT (board_id, snapshot_date)
  DO UPDATE SET column_counts = COALESCE(counts, '{}'::jsonb), created_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
