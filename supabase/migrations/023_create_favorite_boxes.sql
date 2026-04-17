-- Migration pour créer la table favorite_boxes
CREATE TABLE IF NOT EXISTS public.favorite_boxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  box_id UUID NOT NULL REFERENCES public.loot_boxes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, box_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_favorite_boxes_user_id ON public.favorite_boxes(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_boxes_box_id ON public.favorite_boxes(box_id);

-- RLS policies
ALTER TABLE public.favorite_boxes ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
  ON public.favorite_boxes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add their own favorites
CREATE POLICY "Users can add own favorites"
  ON public.favorite_boxes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own favorites
CREATE POLICY "Users can remove own favorites"
  ON public.favorite_boxes
  FOR DELETE
  USING (auth.uid() = user_id);
