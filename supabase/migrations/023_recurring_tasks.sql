-- Add recurrence fields to cards
ALTER TABLE cards ADD COLUMN IF NOT EXISTS recurrence_rule TEXT DEFAULT NULL;
-- recurrence_rule format: 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', or null for non-recurring
ALTER TABLE cards ADD COLUMN IF NOT EXISTS recurrence_source_id UUID REFERENCES cards(id) ON DELETE SET NULL DEFAULT NULL;
-- recurrence_source_id links a spawned copy back to the original recurring card
