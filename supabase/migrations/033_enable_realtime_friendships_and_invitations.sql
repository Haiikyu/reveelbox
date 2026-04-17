-- Enable Realtime for friendships and battle_invitations tables
-- Required for friend request notifications and battle invite notifications to work
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE battle_invitations;
