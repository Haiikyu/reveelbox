-- 024_profile_rewrite.sql
-- Indexes et vues pour la refonte du profil

-- Index pour lookup profil public par username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
ON profiles (LOWER(username)) WHERE username IS NOT NULL;

-- Index friendships
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships (requester_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships (addressee_id, status);

-- Vue : stats publiques pré-calculées
CREATE OR REPLACE VIEW profile_public_stats AS
SELECT
  p.id as user_id, p.username, p.avatar_url, p.level, p.total_exp,
  p.consecutive_days, p.longest_streak, p.created_at as member_since,
  p.theme, p.privacy_profile,
  COALESCE(inv.total_items, 0) as total_items,
  COALESCE(inv.total_value, 0) as inventory_value,
  COALESCE(bat.battles_played, 0) as battles_played,
  COALESCE(bat.battles_won, 0) as battles_won,
  CASE WHEN COALESCE(bat.battles_played, 0) > 0
    THEN ROUND((COALESCE(bat.battles_won, 0)::numeric / bat.battles_played) * 100, 1)
    ELSE 0 END as win_rate
FROM profiles p
LEFT JOIN (
  SELECT user_id, COUNT(*) FILTER (WHERE NOT is_sold) as total_items,
    COALESCE(SUM(i.market_value) FILTER (WHERE NOT ui.is_sold), 0) as total_value
  FROM user_inventory ui LEFT JOIN items i ON ui.item_id = i.id GROUP BY user_id
) inv ON inv.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as battles_played, COUNT(*) FILTER (WHERE is_winner) as battles_won
  FROM battle_participants GROUP BY user_id
) bat ON bat.user_id = p.id;

-- RLS friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'friends_select' AND tablename = 'friendships') THEN
    CREATE POLICY friends_select ON friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'friends_insert' AND tablename = 'friendships') THEN
    CREATE POLICY friends_insert ON friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'friends_update' AND tablename = 'friendships') THEN
    CREATE POLICY friends_update ON friendships FOR UPDATE USING (auth.uid() = addressee_id OR auth.uid() = requester_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'friends_delete' AND tablename = 'friendships') THEN
    CREATE POLICY friends_delete ON friendships FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
  END IF;
END $$;

-- Fonction helper pour check amitié
CREATE OR REPLACE FUNCTION is_friend_with(target_user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships WHERE status = 'accepted'
    AND ((requester_id = auth.uid() AND addressee_id = target_user_id)
      OR (addressee_id = auth.uid() AND requester_id = target_user_id))
  );
$$;

-- Index pour historique paginé
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_date ON user_inventory (user_id, obtained_at DESC);
CREATE INDEX IF NOT EXISTS idx_battle_participants_user_date ON battle_participants (user_id, created_at DESC);
