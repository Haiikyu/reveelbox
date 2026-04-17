-- 027_profile_views.sql
-- Table pour tracker les visites de profil (compteur mensuel)

CREATE TABLE IF NOT EXISTS public.profile_views (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id  uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profile_views_profile_month
  ON profile_views (profile_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_profile
  ON profile_views (viewer_id, profile_id, viewed_at DESC);

-- RLS
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- N'importe quel user connecté peut insérer une vue
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pv_insert' AND tablename = 'profile_views') THEN
    CREATE POLICY pv_insert ON profile_views
      FOR INSERT WITH CHECK (auth.uid() = viewer_id OR viewer_id IS NULL);
  END IF;
END $$;

-- Seul le propriétaire du profil peut lire ses vues
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pv_select_owner' AND tablename = 'profile_views') THEN
    CREATE POLICY pv_select_owner ON profile_views
      FOR SELECT USING (auth.uid() = profile_id);
  END IF;
END $$;
