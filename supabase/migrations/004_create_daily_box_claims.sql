-- Migration pour créer la table daily_box_claims
-- Cette table stocke les réclamations quotidiennes de freedrop

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.daily_box_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_box_id UUID NOT NULL REFERENCES public.loot_boxes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  claimed_date DATE DEFAULT CURRENT_DATE NOT NULL,

  -- Index pour optimiser les requêtes
  CONSTRAINT unique_user_box_date UNIQUE (user_id, daily_box_id, claimed_date)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_daily_box_claims_user_id ON public.daily_box_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_box_claims_box_id ON public.daily_box_claims(daily_box_id);
CREATE INDEX IF NOT EXISTS idx_daily_box_claims_claimed_date ON public.daily_box_claims(claimed_date);
CREATE INDEX IF NOT EXISTS idx_daily_box_claims_user_date ON public.daily_box_claims(user_id, claimed_date);

-- Activer Row Level Security (RLS)
ALTER TABLE public.daily_box_claims ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs peuvent voir leurs propres réclamations
CREATE POLICY "Users can view own claims" ON public.daily_box_claims
  FOR SELECT USING (auth.uid() = user_id);

-- Politique RLS : Les utilisateurs peuvent insérer leurs propres réclamations
CREATE POLICY "Users can insert own claims" ON public.daily_box_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique RLS : Les admins peuvent tout voir
CREATE POLICY "Admins can view all claims" ON public.daily_box_claims
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Commentaires pour documentation
COMMENT ON TABLE public.daily_box_claims IS 'Stocke les réclamations quotidiennes de freedrop par utilisateur';
COMMENT ON COLUMN public.daily_box_claims.user_id IS 'ID de l''utilisateur qui réclame';
COMMENT ON COLUMN public.daily_box_claims.daily_box_id IS 'ID de la boîte freedrop réclamée';
COMMENT ON COLUMN public.daily_box_claims.item_id IS 'ID de l''objet reçu';
COMMENT ON COLUMN public.daily_box_claims.claimed_date IS 'Date de réclamation (pour tracking quotidien)';
