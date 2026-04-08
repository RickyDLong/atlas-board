-- Add estimated and actual hours to cards for time tracking
ALTER TABLE cards ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(6,2) DEFAULT NULL;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS actual_hours NUMERIC(6,2) DEFAULT NULL;
