-- Daily quests: auto-generated per-day objectives that award XP on completion
create table if not exists daily_quests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  board_id     uuid not null references boards(id) on delete cascade,
  date         date not null,
  quest_type   text not null,   -- 'complete_cards', 'create_cards', 'log_time', 'clear_column', 'complete_epic_card'
  label        text not null,   -- Human-readable quest title
  target       int not null,    -- How many to hit
  progress     int not null default 0,
  completed    boolean not null default false,
  xp_reward    int not null,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

-- One set of quests per user+board+date
create unique index daily_quests_user_board_date_type
  on daily_quests(user_id, board_id, date, quest_type);

-- RLS
alter table daily_quests enable row level security;

create policy "Users manage their own daily quests"
  on daily_quests for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast daily lookup
create index daily_quests_user_date_idx on daily_quests(user_id, date desc);

-- Realtime sync
alter publication supabase_realtime add table daily_quests;
