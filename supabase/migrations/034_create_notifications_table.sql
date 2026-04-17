-- ─── Table notifications persistantes ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text        NOT NULL, -- 'friend_request' | 'friend_accepted' | 'battle_invitation' | 'battle_finished'
  payload    jsonb       NOT NULL DEFAULT '{}',
  read       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour fetch rapide par user
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id, created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Seules les fonctions SECURITY DEFINER peuvent insérer
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ─── Trigger : demande d'ami reçue ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_friend_request()
RETURNS TRIGGER AS $$
DECLARE
  v_username text;
  v_avatar   text;
BEGIN
  IF NEW.status <> 'pending' THEN RETURN NEW; END IF;

  SELECT username, avatar_url INTO v_username, v_avatar
  FROM profiles WHERE id = NEW.requester_id;

  INSERT INTO notifications (user_id, type, payload)
  VALUES (
    NEW.addressee_id,
    'friend_request',
    jsonb_build_object(
      'friendship_id',  NEW.id,
      'from_user_id',   NEW.requester_id,
      'from_username',  v_username,
      'from_avatar',    v_avatar
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_friend_request ON friendships;
CREATE TRIGGER trg_notify_friend_request
  AFTER INSERT ON friendships
  FOR EACH ROW EXECUTE FUNCTION notify_on_friend_request();

-- ─── Trigger : demande d'ami acceptée ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_friend_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_username text;
  v_avatar   text;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status <> 'accepted' THEN RETURN NEW; END IF;

  SELECT username, avatar_url INTO v_username, v_avatar
  FROM profiles WHERE id = NEW.addressee_id;

  INSERT INTO notifications (user_id, type, payload)
  VALUES (
    NEW.requester_id,
    'friend_accepted',
    jsonb_build_object(
      'friendship_id',  NEW.id,
      'from_user_id',   NEW.addressee_id,
      'from_username',  v_username,
      'from_avatar',    v_avatar
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_friend_accepted ON friendships;
CREATE TRIGGER trg_notify_friend_accepted
  AFTER UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION notify_on_friend_accepted();

-- ─── Trigger : invitation de battle reçue ─────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_battle_invitation()
RETURNS TRIGGER AS $$
DECLARE
  v_username text;
  v_avatar   text;
BEGIN
  SELECT username, avatar_url INTO v_username, v_avatar
  FROM profiles WHERE id = NEW.from_user_id;

  INSERT INTO notifications (user_id, type, payload)
  VALUES (
    NEW.to_user_id,
    'battle_invitation',
    jsonb_build_object(
      'invitation_id',  NEW.id,
      'battle_id',      NEW.battle_id,
      'from_user_id',   NEW.from_user_id,
      'from_username',  v_username,
      'from_avatar',    v_avatar,
      'message',        NEW.message
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_battle_invitation ON battle_invitations;
CREATE TRIGGER trg_notify_battle_invitation
  AFTER INSERT ON battle_invitations
  FOR EACH ROW EXECUTE FUNCTION notify_on_battle_invitation();

-- ─── Realtime sur la table notifications ──────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
