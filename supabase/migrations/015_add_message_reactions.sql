-- Migration pour ajouter les réactions aux messages

-- Créer la table des réactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte unique : un utilisateur ne peut réagir qu'une fois avec le même emoji sur un message
  UNIQUE(message_id, user_id, emoji)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- Ajouter des colonnes à chat_messages_new pour l'édition et la suppression
ALTER TABLE chat_messages_new
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES chat_messages_new(id) ON DELETE SET NULL;

-- Index pour les réponses
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON chat_messages_new(reply_to_id);

-- Row Level Security pour message_reactions
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut voir les réactions
CREATE POLICY "Tout le monde peut voir les réactions"
  ON message_reactions
  FOR SELECT
  USING (true);

-- Policy: Les utilisateurs authentifiés peuvent ajouter des réactions
CREATE POLICY "Les utilisateurs authentifiés peuvent ajouter des réactions"
  ON message_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres réactions
CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres réactions"
  ON message_reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour nettoyer les réactions des messages supprimés
CREATE OR REPLACE FUNCTION clean_orphaned_reactions()
RETURNS trigger AS $$
BEGIN
  DELETE FROM message_reactions
  WHERE message_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour nettoyer les réactions quand un message est supprimé (soft delete)
CREATE TRIGGER trigger_clean_reactions_on_message_delete
  AFTER UPDATE OF deleted_at ON chat_messages_new
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
  EXECUTE FUNCTION clean_orphaned_reactions();

-- Vue pour récupérer les messages avec leurs réactions
CREATE OR REPLACE VIEW chat_messages_with_reactions AS
SELECT
  m.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', r.id,
        'message_id', r.message_id,
        'user_id', r.user_id,
        'emoji', r.emoji,
        'created_at', r.created_at
      )
    ) FILTER (WHERE r.id IS NOT NULL),
    '[]'::json
  ) as reactions
FROM chat_messages_new m
LEFT JOIN message_reactions r ON m.id = r.message_id
WHERE m.deleted_at IS NULL
GROUP BY m.id;

COMMENT ON TABLE message_reactions IS 'Stocke les réactions emoji aux messages du chat';
COMMENT ON VIEW chat_messages_with_reactions IS 'Vue combinant les messages et leurs réactions';
