-- Fix définitif: Le gagnant reçoit TOUS les items unboxés par TOUS les participants
DROP FUNCTION IF EXISTS finalize_battle(uuid);

CREATE OR REPLACE FUNCTION finalize_battle(
  p_battle_id uuid
)
RETURNS TABLE(
  success boolean,
  winner_id uuid,
  winner_value numeric,
  error text
) AS $$
DECLARE
  v_winner_participant record;
  v_battle_status text;
  v_items_added integer := 0;
BEGIN
  -- Vérifier que la battle n'a pas déjà été finalisée
  SELECT status INTO v_battle_status
  FROM battles
  WHERE id = p_battle_id;

  IF v_battle_status = 'finished' THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::numeric, 'Battle already finished'::text;
    RETURN;
  END IF;

  -- Trouver le participant avec la plus grande valeur totale
  SELECT
    id,
    user_id,
    total_value,
    is_bot
  INTO v_winner_participant
  FROM battle_participants
  WHERE battle_id = p_battle_id
  ORDER BY total_value DESC, joined_at ASC
  LIMIT 1;

  IF v_winner_participant.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::numeric, 'No participants found'::text;
    RETURN;
  END IF;

  -- Marquer le gagnant
  UPDATE battle_participants
  SET
    is_winner = true,
    final_rank = 1
  WHERE id = v_winner_participant.id;

  -- Mettre à jour le statut de la battle
  UPDATE battles
  SET
    status = 'finished',
    winner_user_id = v_winner_participant.user_id,
    finished_at = now()
  WHERE id = p_battle_id;

  -- Si le gagnant n'est pas un bot, ajouter TOUS les items à son inventaire
  IF NOT v_winner_participant.is_bot AND v_winner_participant.user_id IS NOT NULL THEN
    -- Ajouter chaque item unboxé individuellement (pas de DISTINCT)
    -- Le gagnant récupère TOUS les items de TOUS les participants
    INSERT INTO user_inventory (user_id, item_id, box_id, obtained_from, obtained_at)
    SELECT
      v_winner_participant.user_id,
      bo.item_id,
      bo.loot_box_id,
      'battle'::text,
      now()
    FROM battle_openings bo
    WHERE bo.battle_id = p_battle_id;

    GET DIAGNOSTICS v_items_added = ROW_COUNT;

    RAISE NOTICE 'Added % items to winner inventory', v_items_added;
  END IF;

  RETURN QUERY SELECT
    true,
    v_winner_participant.user_id,
    v_winner_participant.total_value::numeric,
    NULL::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION finalize_battle IS 'Finalise une battle et donne TOUS les items unboxés au gagnant';
