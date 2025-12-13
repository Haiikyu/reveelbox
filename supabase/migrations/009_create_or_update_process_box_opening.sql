-- Migration: Créer ou mettre à jour la fonction process_box_opening avec box_id
-- Date: 2025-11-24

CREATE OR REPLACE FUNCTION public.process_box_opening(
  p_user_id uuid,
  p_loot_box_id uuid,
  p_item_id uuid,
  p_cost integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance integer;
  v_inventory_id uuid;
BEGIN
  -- 1. Vérifier le solde de l'utilisateur
  SELECT virtual_currency INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé'
    );
  END IF;

  IF v_current_balance < p_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Solde insuffisant'
    );
  END IF;

  -- 2. Débiter le coût de la box
  UPDATE public.profiles
  SET virtual_currency = virtual_currency - p_cost
  WHERE id = p_user_id;

  -- 3. Ajouter l'item à l'inventaire avec box_id
  INSERT INTO public.user_inventory (
    user_id,
    item_id,
    box_id,
    obtained_from,
    obtained_at
  )
  VALUES (
    p_user_id,
    p_item_id,
    p_loot_box_id,
    'box_opening',
    NOW()
  )
  RETURNING id INTO v_inventory_id;

  -- 4. Enregistrer la transaction
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    description,
    created_at
  )
  VALUES (
    p_user_id,
    'box_opening',
    -p_cost,
    'Ouverture de box',
    NOW()
  );

  -- 5. Retourner le succès
  RETURN jsonb_build_object(
    'success', true,
    'inventory_id', v_inventory_id,
    'new_balance', v_current_balance - p_cost
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Ajouter un commentaire
COMMENT ON FUNCTION public.process_box_opening IS 'Traite l''ouverture d''une loot box: débite le coût, ajoute l''item à l''inventaire avec l''ID de la box, et enregistre la transaction';
