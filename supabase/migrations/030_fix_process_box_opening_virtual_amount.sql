-- 030_fix_process_box_opening_virtual_amount.sql
-- Bug : le trigger trg_award_reevs_on_spend lit NEW.virtual_amount,
-- mais process_box_opening n'insérait que la colonne "amount".
-- Fix : remplir virtual_amount = amount dans le même INSERT.

CREATE OR REPLACE FUNCTION public.process_box_opening(
  p_user_id     uuid,
  p_loot_box_id uuid,
  p_item_id     uuid,
  p_cost        integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance integer;
  v_inventory_id    uuid;
BEGIN
  -- 1. Vérifier le solde
  SELECT virtual_currency INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non trouvé');
  END IF;

  IF v_current_balance < p_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solde insuffisant');
  END IF;

  -- 2. Débiter le coût
  UPDATE public.profiles
  SET virtual_currency = virtual_currency - p_cost
  WHERE id = p_user_id;

  -- 3. Ajouter l'item à l'inventaire
  INSERT INTO public.user_inventory (
    user_id, item_id, box_id, obtained_from, obtained_at
  )
  VALUES (
    p_user_id, p_item_id, p_loot_box_id, 'box_opening', NOW()
  )
  RETURNING id INTO v_inventory_id;

  -- 4. Enregistrer la transaction
  --    virtual_amount est requis par le trigger trg_award_reevs_on_spend
  INSERT INTO public.transactions (
    user_id, type, amount, virtual_amount, description, created_at
  )
  VALUES (
    p_user_id,
    'box_opening',
    -p_cost,
    -p_cost,   -- ← fixe le bug : le trigger peut maintenant calculer les Reevs
    'Ouverture de box',
    NOW()
  );

  RETURN jsonb_build_object(
    'success',       true,
    'inventory_id',  v_inventory_id,
    'new_balance',   v_current_balance - p_cost
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.process_box_opening IS
  'Traite l''ouverture d''une loot box : débite les coins, ajoute l''item '
  'à l''inventaire, enregistre la transaction (virtual_amount requis pour '
  'le cashback Reevs via trg_award_reevs_on_spend).';
