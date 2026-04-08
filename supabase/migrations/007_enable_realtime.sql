-- Enable realtime for board tables
alter publication supabase_realtime add table cards;
alter publication supabase_realtime add table columns;
alter publication supabase_realtime add table categories;
alter publication supabase_realtime add table epics;
alter publication supabase_realtime add table subtasks;
