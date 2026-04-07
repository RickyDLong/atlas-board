-- ─── Gamification Tables ─────────────────────────────────────

-- XP Events: every XP-earning action is logged here
CREATE TABLE IF NOT EXISTS user_xp_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  action text NOT NULL,
  xp_amount integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- User Levels: current XP and level for each user
CREATE TABLE IF NOT EXISTS user_levels (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_xp integer NOT NULL DEFAULT 0,
  current_level integer NOT NULL DEFAULT 1,
  title text NOT NULL DEFAULT 'Recruit',
  updated_at timestamptz DEFAULT now()
);

-- User Streaks: daily activity tracking
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_active_date date,
  freeze_tokens integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- User Badges: earned achievements
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key text NOT NULL,
  earned_at timestamptz DEFAULT now(),
  progress jsonb DEFAULT '{}',
  UNIQUE(user_id, badge_key)
);

-- ─── Indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_xp_events_user ON user_xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_board ON user_xp_events(board_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_created ON user_xp_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_badges_user ON user_badges(user_id);

-- ─── Row Level Security ──────────────────────────────────────

ALTER TABLE user_xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- XP events: users can only see/insert their own
CREATE POLICY "Users can view own xp events" ON user_xp_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp events" ON user_xp_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Levels: users can view/upsert their own
CREATE POLICY "Users can view own level" ON user_levels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own level" ON user_levels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own level" ON user_levels FOR UPDATE USING (auth.uid() = user_id);

-- Streaks: users can view/upsert their own
CREATE POLICY "Users can view own streak" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streak" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- Badges: users can view/insert their own
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own badges" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
