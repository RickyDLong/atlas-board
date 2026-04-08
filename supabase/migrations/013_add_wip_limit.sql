-- Add optional WIP (Work In Progress) limit per column
ALTER TABLE columns ADD COLUMN IF NOT EXISTS wip_limit INTEGER DEFAULT NULL;
