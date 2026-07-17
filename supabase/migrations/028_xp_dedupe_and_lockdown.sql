-- XP integrity: make awards idempotent and server-authoritative.
--
-- Two problems this fixes:
--   1. user_xp_events had no uniqueness, so re-entering the done column
--      (or an undo/redo loop) re-awarded XP without limit.
--   2. RLS let any authenticated user INSERT xp events and UPDATE their own
--      current_xp straight from the browser console.

-- ─── Dedupe key ──────────────────────────────────────────────

alter table user_xp_events add column if not exists dedupe_key text;

comment on column user_xp_events.dedupe_key is
  'Server-computed idempotency key, e.g. card_complete:<card_id>. NULL for legacy rows, which the partial unique index ignores.';

-- Partial index: legacy rows all have dedupe_key IS NULL and are excluded, so
-- this builds cleanly over existing data with no backfill.
create unique index if not exists idx_xp_events_dedupe
  on user_xp_events(user_id, dedupe_key)
  where dedupe_key is not null;

-- ─── Lock down client writes ─────────────────────────────────
-- Awards now run exclusively through /api/gamification/award with the
-- service-role key, which bypasses RLS. Clients keep SELECT so the UI and the
-- realtime subscriptions from 026_gamification_realtime.sql keep working.

drop policy if exists "Users can insert own xp events" on user_xp_events;

drop policy if exists "Users can insert own level" on user_levels;
drop policy if exists "Users can update own level" on user_levels;

drop policy if exists "Users can insert own streak" on user_streaks;
drop policy if exists "Users can update own streak" on user_streaks;

drop policy if exists "Users can insert own badges" on user_badges;
