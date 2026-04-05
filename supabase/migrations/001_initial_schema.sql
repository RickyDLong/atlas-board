-- Atlas Board: Initial Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── Boards ──────────────────────────────────────────────────

create table boards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'My Board',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table boards enable row level security;

create policy "Users can view own boards"
  on boards for select using (auth.uid() = user_id);
create policy "Users can create own boards"
  on boards for insert with check (auth.uid() = user_id);
create policy "Users can update own boards"
  on boards for update using (auth.uid() = user_id);
create policy "Users can delete own boards"
  on boards for delete using (auth.uid() = user_id);

-- ─── Columns ─────────────────────────────────────────────────

create table columns (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid references boards(id) on delete cascade not null,
  title text not null,
  color text not null default '#555568',
  position integer not null default 0,
  created_at timestamptz default now() not null
);

alter table columns enable row level security;

create policy "Users can view columns of own boards"
  on columns for select using (
    board_id in (select id from boards where user_id = auth.uid())
  );
create policy "Users can create columns on own boards"
  on columns for insert with check (
    board_id in (select id from boards where user_id = auth.uid())
  );
create policy "Users can update columns on own boards"
  on columns for update using (
    board_id in (select id from boards where user_id = auth.uid())
  );
create policy "Users can delete columns on own boards"
  on columns for delete using (
    board_id in (select id from boards where user_id = auth.uid())
  );

-- ─── Categories ──────────────────────────────────────────────

create table categories (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid references boards(id) on delete cascade not null,
  label text not null,
  color text not null default '#4a9eff',
  position integer not null default 0,
  created_at timestamptz default now() not null
);

alter table categories enable row level security;

create policy "Users can view categories of own boards"
  on categories for select using (
    board_id in (select id from boards where user_id = auth.uid())
  );
create policy "Users can create categories on own boards"
  on categories for insert with check (
    board_id in (select id from boards where user_id = auth.uid())
  );
create policy "Users can update categories on own boards"
  on categories for update using (
    board_id in (select id from boards where user_id = auth.uid())
  );
create policy "Users can delete categories on own boards"
  on categories for delete using (
    board_id in (select id from boards where user_id = auth.uid())
  );

-- ─── Epics ───────────────────────────────────────────────────

create table epics (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid references boards(id) on delete cascade not null,
  name text not null,
  description text,
  color text not null default '#4a9eff',
  status text not null default 'planning'
    check (status in ('planning', 'active', 'completed', 'archived')),
  target_date date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table epics enable row level security;

create policy "Users can view epics of own boards"
  on epics for select using (
    board_id in (select id from boards where user_id = auth.uid())
  );
create policy "Users can create epics on own boards"
  on epics for insert with check (
    board_id in (select id from boards where user_id = auth.uid())
  );
create policy "Users can update epics on own boards"
  on epics for update using (
    board_id in (select id from boards where user_id = auth.uid())
  );
create policy "Users can delete epics on own boards"
  on epics for delete using (
    board_id in (select id from boards where user_id = auth.uid())
  );

-- ─── Cards ───────────────────────────────────────────────────

create table cards (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid references boards(id) on delete cascade not null,
  column_id uuid references columns(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  epic_id uuid references epics(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'medium'
    check (priority in ('critical', 'high', 'medium', 'low')),
  effort text check (effort in ('XS', 'S', 'M', 'L', 'XL')),
  notes text,
  position integer not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table cards enable row level security;

create policy "Users can view cards of own boards"
  on cards for select using (
    board_id in (select id from boards where user_id = auth.uid())
  );
create policy "Users can create cards on own boards"
  on cards for insert with check (
    board_id in (select id from boards where user_id = auth.uid())
  );
create policy "Users can update cards on own boards"
  on cards for update using (
    board_id in (select id from boards where user_id = auth.uid())
  );
create policy "Users can delete cards on own boards"
  on cards for delete using (
    board_id in (select id from boards where user_id = auth.uid())
  );

-- ─── Indexes ─────────────────────────────────────────────────

create index idx_boards_user_id on boards(user_id);
create index idx_columns_board_id on columns(board_id);
create index idx_categories_board_id on categories(board_id);
create index idx_epics_board_id on epics(board_id);
create index idx_cards_board_id on cards(board_id);
create index idx_cards_column_id on cards(column_id);
create index idx_cards_epic_id on cards(epic_id);
