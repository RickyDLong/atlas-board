-- Add gamification toggle to user_preferences
alter table user_preferences add column gamification_enabled boolean default true not null;
