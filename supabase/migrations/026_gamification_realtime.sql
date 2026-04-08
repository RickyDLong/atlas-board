-- Enable realtime replication for gamification tables
-- so XP, level, streak, and badge updates sync across browser tabs
alter publication supabase_realtime add table user_levels;
alter publication supabase_realtime add table user_streaks;
alter publication supabase_realtime add table user_badges;
