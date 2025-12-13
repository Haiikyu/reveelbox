-- Migration: Ajouter box_id à user_inventory pour tracking des boxes
-- Date: 2025-11-24

-- Ajouter la colonne box_id avec une foreign key vers loot_boxes
ALTER TABLE public.user_inventory
ADD COLUMN IF NOT EXISTS box_id uuid REFERENCES public.loot_boxes(id) ON DELETE SET NULL;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_user_inventory_box_id ON public.user_inventory(box_id);

-- Commentaire pour la colonne
COMMENT ON COLUMN public.user_inventory.box_id IS 'ID de la loot box dont provient cet item (null si obtenu autrement)';
