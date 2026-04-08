-- Atlas Board: Subtasks / Checklists

-- ─── Subtasks ────────────────────────────────────────────────

create table subtasks (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references cards(id) on delete cascade not null,
  title text not null,
  completed boolean default false not null,
  position integer default 0 not null,
  created_at timestamptz default now() not null
);

alter table subtasks enable row level security;

create policy "Users can view subtasks on own cards"
  on subtasks for select using (
    card_id in (
      select id from cards
      where board_id in (select id from boards where user_id = auth.uid())
    )
  );

create policy "Users can create subtasks on own cards"
  on subtasks for insert with check (
    card_id in (
      select id from cards
      where board_id in (select id from boards where user_id = auth.uid())
    )
  );

create policy "Users can update subtasks on own cards"
  on subtasks for update using (
    card_id in (
      select id from cards
      where board_id in (select id from boards where user_id = auth.uid())
    )
  );

create policy "Users can delete subtasks on own cards"
  on subtasks for delete using (
    card_id in (
      select id from cards
      where board_id in (select id from boards where user_id = auth.uid())
    )
  );

-- ─── Indexes ─────────────────────────────────────────────────

create index idx_subtasks_card_id on subtasks(card_id);
