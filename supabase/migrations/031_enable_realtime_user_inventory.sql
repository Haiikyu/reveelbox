-- Enable Supabase Realtime on user_inventory table
-- Required for real-time cart updates in the Navbar
alter publication supabase_realtime add table user_inventory;
