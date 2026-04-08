-- User Preferences for Notifications
create table user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  overdue_notifications boolean default true not null,
  notification_email text,
  notification_time time default '08:00:00'::time not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table user_preferences enable row level security;

create policy "Users can view own preferences"
  on user_preferences for select using (auth.uid() = user_id);
create policy "Users can insert own preferences"
  on user_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own preferences"
  on user_preferences for update using (auth.uid() = user_id);
create policy "Users can delete own preferences"
  on user_preferences for delete using (auth.uid() = user_id);

create index idx_user_preferences_user_id on user_preferences(user_id);
