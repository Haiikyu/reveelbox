-- 025_backgrounds_and_idrev.sql
-- Shop backgrounds + IDRev system

-- ========================================
-- PARTIE A : Shop Backgrounds
-- ========================================

-- Table des backgrounds disponibles dans le shop
CREATE TABLE IF NOT EXISTS shop_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price integer NOT NULL DEFAULT 0,
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  image_url text,
  css_value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_bg_content CHECK (image_url IS NOT NULL OR css_value IS NOT NULL)
);

-- Table des backgrounds achetés par les utilisateurs
CREATE TABLE IF NOT EXISTS user_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  background_id uuid NOT NULL REFERENCES shop_backgrounds(id) ON DELETE CASCADE,
  is_equipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, background_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_backgrounds_user ON user_backgrounds(user_id);
CREATE INDEX IF NOT EXISTS idx_user_backgrounds_equipped ON user_backgrounds(user_id, is_equipped) WHERE is_equipped = true;

-- RLS
ALTER TABLE shop_backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_backgrounds ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'shop_bg_select' AND tablename = 'shop_backgrounds') THEN
    CREATE POLICY shop_bg_select ON shop_backgrounds FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_bg_select' AND tablename = 'user_backgrounds') THEN
    CREATE POLICY user_bg_select ON user_backgrounds FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_bg_insert' AND tablename = 'user_backgrounds') THEN
    CREATE POLICY user_bg_insert ON user_backgrounds FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_bg_update' AND tablename = 'user_backgrounds') THEN
    CREATE POLICY user_bg_update ON user_backgrounds FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_bg_delete' AND tablename = 'user_backgrounds') THEN
    CREATE POLICY user_bg_delete ON user_backgrounds FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- RPC : Acheter un background
CREATE OR REPLACE FUNCTION buy_background(p_user_id uuid, p_background_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_price integer;
  v_balance integer;
BEGIN
  -- Vérifier si déjà possédé
  IF EXISTS (SELECT 1 FROM user_backgrounds WHERE user_id = p_user_id AND background_id = p_background_id) THEN
    RAISE EXCEPTION 'Background déjà possédé';
  END IF;

  -- Récupérer le prix
  SELECT price INTO v_price FROM shop_backgrounds WHERE id = p_background_id;
  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Background introuvable';
  END IF;

  -- Vérifier le solde
  SELECT virtual_currency INTO v_balance FROM profiles WHERE id = p_user_id;
  IF v_balance < v_price THEN
    RAISE EXCEPTION 'Solde insuffisant';
  END IF;

  -- Déduire le prix
  UPDATE profiles SET virtual_currency = virtual_currency - v_price WHERE id = p_user_id;

  -- Insérer l'achat
  INSERT INTO user_backgrounds (user_id, background_id) VALUES (p_user_id, p_background_id);
END;
$$;

-- RPC : Équiper/déséquiper un background
CREATE OR REPLACE FUNCTION equip_background(p_user_id uuid, p_background_id uuid, p_equip boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Vérifier propriété
  IF NOT EXISTS (SELECT 1 FROM user_backgrounds WHERE user_id = p_user_id AND background_id = p_background_id) THEN
    RAISE EXCEPTION 'Background non possédé';
  END IF;

  -- Déséquiper tous les backgrounds
  UPDATE user_backgrounds SET is_equipped = false WHERE user_id = p_user_id AND is_equipped = true;

  -- Équiper celui choisi
  IF p_equip THEN
    UPDATE user_backgrounds SET is_equipped = true WHERE user_id = p_user_id AND background_id = p_background_id;
  END IF;
END;
$$;

-- ========================================
-- PARTIE B : IDRev
-- ========================================

-- Fonction pour générer un IDRev unique
CREATE OR REPLACE FUNCTION generate_id_rev()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_id text;
  v_exists boolean;
BEGIN
  LOOP
    -- Générer 5 caractères alphanumériques lowercase
    v_id := 'RV-' || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id_rev = v_id) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_id;
END;
$$;

-- Ajouter les colonnes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_rev text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_slug text UNIQUE;

-- Contrainte sur custom_slug
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'chk_custom_slug_format'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT chk_custom_slug_format
      CHECK (custom_slug IS NULL OR custom_slug ~ '^[a-zA-Z0-9-]{3,24}$');
  END IF;
END $$;

-- Backfill tous les profils existants sans id_rev
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM profiles WHERE id_rev IS NULL LOOP
    UPDATE profiles SET id_rev = generate_id_rev() WHERE id = r.id;
  END LOOP;
END $$;

-- Rendre non-nullable avec default
ALTER TABLE profiles ALTER COLUMN id_rev SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN id_rev SET DEFAULT generate_id_rev();

-- Index pour lookup rapide
CREATE INDEX IF NOT EXISTS idx_profiles_id_rev ON profiles(id_rev);
CREATE INDEX IF NOT EXISTS idx_profiles_custom_slug ON profiles(custom_slug) WHERE custom_slug IS NOT NULL;

-- Mettre à jour le trigger handle_new_user pour inclure id_rev
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, id_rev)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', NULL),
    generate_id_rev()
  );
  RETURN new;
END;
$$;
