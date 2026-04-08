-- Change activity_log.card_id from ON DELETE CASCADE to ON DELETE SET NULL
-- so that activity history survives card deletion (audit trail)
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_card_id_fkey;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_card_id_fkey
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL;
