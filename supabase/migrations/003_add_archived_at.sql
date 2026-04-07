-- Add archived_at to cards for soft-archiving
alter table cards add column archived_at timestamptz;
create index idx_cards_archived on cards(archived_at) where archived_at is not null;

-- Add archived_at to epics for soft-archiving
alter table epics add column archived_at timestamptz;
create index idx_epics_archived on epics(archived_at) where archived_at is not null;
