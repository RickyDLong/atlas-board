-- Add due_date to cards
alter table cards add column due_date date;

-- Index for querying overdue cards
create index idx_cards_due_date on cards(due_date) where due_date is not null;
