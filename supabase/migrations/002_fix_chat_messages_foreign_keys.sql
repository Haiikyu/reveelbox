-- Migration pour corriger les relations de chat_messages_new
-- Créé le: 2024-01-XX

-- 1. Ajouter la clé étrangère manquante entre chat_messages_new et profiles
DO $ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_messages_new_user_id_fkey'
    ) THEN
        ALTER TABLE chat_messages_new 
        ADD CONSTRAINT chat_messages_new_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $;

-- 2. Vérifier si la relation avec chat_rooms existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_messages_new_room_id_fkey'
    ) THEN
        ALTER TABLE chat_messages_new 
        ADD CONSTRAINT chat_messages_new_room_id_fkey 
        FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_chat_messages_new_user_id ON chat_messages_new(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_new_room_id ON chat_messages_new(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_new_created_at ON chat_messages_new(created_at DESC);

-- 4. Configurer RLS (Row Level Security) si nécessaire
ALTER TABLE chat_messages_new ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre la lecture des messages à tous les utilisateurs authentifiés
CREATE POLICY "chat_messages_new_read_policy" ON chat_messages_new
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy pour permettre l'insertion de messages aux utilisateurs authentifiés
CREATE POLICY "chat_messages_new_insert_policy" ON chat_messages_new
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy pour permettre la suppression de ses propres messages ou aux admins
CREATE POLICY "chat_messages_new_delete_policy" ON chat_messages_new
    FOR DELETE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- 5. Insérer une room par défaut si elle n'existe pas
INSERT INTO chat_rooms (id, name, description, is_active) 
SELECT 
    gen_random_uuid(), 
    'Global', 
    'Chat général de ReveelBox', 
    true
WHERE NOT EXISTS (
    SELECT 1 FROM chat_rooms WHERE name = 'Global'
);

-- 6. Migration terminée avec succès

-- 7. Commentaires sur les colonnes
COMMENT ON TABLE chat_messages_new IS 'Table des messages du chat en temps réel';
COMMENT ON COLUMN chat_messages_new.user_id IS 'ID de l''utilisateur qui a envoyé le message';
COMMENT ON COLUMN chat_messages_new.room_id IS 'ID de la room où le message a été envoyé';
COMMENT ON COLUMN chat_messages_new.content IS 'Contenu du message (max 1000 caractères)';
COMMENT ON COLUMN chat_messages_new.message_type IS 'Type de message: user_message, system_message, giveaway_announcement, giveaway_results';
