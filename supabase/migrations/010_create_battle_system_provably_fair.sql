-- Migration: Système provably fair pour les battles
-- Crée les fonctions nécessaires pour un système d'ouverture équitable et vérifiable

-- =====================================================
-- 0. Supprimer les fonctions existantes si elles existent
-- =====================================================
DROP FUNCTION IF EXISTS process_battle_box_opening(uuid, uuid, uuid, text, text);
DROP FUNCTION IF EXISTS process_battle_box_opening(uuid, uuid, uuid, text, text, integer);
DROP FUNCTION IF EXISTS finalize_battle(uuid);
DROP FUNCTION IF EXISTS generate_all_battle_openings(uuid);

-- =====================================================
-- 1. Fonction pour générer l'ouverture d'une box battle
-- =====================================================
CREATE OR REPLACE FUNCTION process_battle_box_opening(
  p_battle_id uuid,
  p_participant_id uuid,
  p_loot_box_id uuid,
  p_server_seed text,
  p_client_seed text DEFAULT NULL,
  p_box_instance integer DEFAULT 1
)
RETURNS TABLE(
  success boolean,
  item_id uuid,
  item_name text,
  item_value numeric,
  item_rarity text,
  item_image_url text,
  error text
) AS $$
DECLARE
  v_client_seed text;
  v_combined_hash text;
  v_random_value numeric;
  v_total_probability numeric;
  v_cumulative_probability numeric;
  v_selected_item record;
  v_battle_status text;
BEGIN
  -- Vérifier que la battle existe et est active
  SELECT status INTO v_battle_status
  FROM battles
  WHERE id = p_battle_id;

  IF v_battle_status IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::numeric, NULL::text, NULL::text, 'Battle not found'::text;
    RETURN;
  END IF;

  IF v_battle_status NOT IN ('countdown', 'active') THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::numeric, NULL::text, NULL::text, 'Battle is not in valid state'::text;
    RETURN;
  END IF;

  -- Générer ou utiliser le client seed
  v_client_seed := COALESCE(p_client_seed, encode(gen_random_bytes(16), 'hex'));

  -- Créer le hash combiné (provably fair)
  v_combined_hash := encode(
    digest(p_server_seed || v_client_seed || p_battle_id::text, 'sha256'),
    'hex'
  );

  -- Convertir le hash en nombre aléatoire (0-1)
  v_random_value := ('x' || substring(v_combined_hash, 1, 8))::bit(32)::bigint::numeric / 4294967295.0;

  -- Obtenir la probabilité totale
  SELECT SUM(probability) INTO v_total_probability
  FROM loot_box_items
  WHERE loot_box_id = p_loot_box_id;

  IF v_total_probability IS NULL OR v_total_probability = 0 THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::numeric, NULL::text, NULL::text, 'No items in box'::text;
    RETURN;
  END IF;

  -- Sélectionner l'item basé sur la probabilité
  v_cumulative_probability := 0;
  v_random_value := v_random_value * v_total_probability;

  FOR v_selected_item IN (
    SELECT
      lbi.item_id,
      i.name,
      i.market_value,
      i.rarity,
      i.image_url,
      lbi.probability
    FROM loot_box_items lbi
    JOIN items i ON i.id = lbi.item_id
    WHERE lbi.loot_box_id = p_loot_box_id
    ORDER BY lbi.probability DESC
  ) LOOP
    v_cumulative_probability := v_cumulative_probability + v_selected_item.probability;

    IF v_random_value <= v_cumulative_probability THEN
      -- Enregistrer l'ouverture
      INSERT INTO battle_openings (
        battle_id,
        participant_id,
        loot_box_id,
        item_id,
        item_value,
        item_rarity,
        box_instance,
        server_seed_hash,
        client_seed,
        opened_at
      ) VALUES (
        p_battle_id,
        p_participant_id,
        p_loot_box_id,
        v_selected_item.item_id,
        v_selected_item.market_value,
        v_selected_item.rarity,
        p_box_instance,
        encode(digest(p_server_seed, 'sha256'), 'hex'),
        v_client_seed,
        now()
      );

      -- Mettre à jour la valeur totale du participant
      UPDATE battle_participants
      SET total_value = total_value + v_selected_item.market_value
      WHERE id = p_participant_id;

      -- Retourner le résultat
      RETURN QUERY SELECT
        true,
        v_selected_item.item_id,
        v_selected_item.name,
        v_selected_item.market_value,
        v_selected_item.rarity,
        v_selected_item.image_url,
        NULL::text;
      RETURN;
    END IF;
  END LOOP;

  -- Fallback: retourner le premier item si aucun n'a été sélectionné
  SELECT
    lbi.item_id,
    i.name,
    i.market_value,
    i.rarity,
    i.image_url
  INTO v_selected_item
  FROM loot_box_items lbi
  JOIN items i ON i.id = lbi.item_id
  WHERE lbi.loot_box_id = p_loot_box_id
  LIMIT 1;

  IF v_selected_item.item_id IS NOT NULL THEN
    INSERT INTO battle_openings (
      battle_id,
      participant_id,
      loot_box_id,
      item_id,
      item_value,
      item_rarity,
      box_instance,
      server_seed_hash,
      client_seed,
      opened_at
    ) VALUES (
      p_battle_id,
      p_participant_id,
      p_loot_box_id,
      v_selected_item.item_id,
      v_selected_item.market_value,
      v_selected_item.rarity,
      p_box_instance,
      encode(digest(p_server_seed, 'sha256'), 'hex'),
      v_client_seed,
      now()
    );

    UPDATE battle_participants
    SET total_value = total_value + v_selected_item.market_value
    WHERE id = p_participant_id;

    RETURN QUERY SELECT
      true,
      v_selected_item.item_id,
      v_selected_item.name,
      v_selected_item.market_value,
      v_selected_item.rarity,
      v_selected_item.image_url,
      NULL::text;
  ELSE
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::numeric, NULL::text, NULL::text, 'Failed to select item'::text;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. Fonction pour finaliser une battle et distribuer les gains
-- =====================================================
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
  v_all_items record;
BEGIN
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

  -- Si le gagnant n'est pas un bot, ajouter les items à son inventaire
  IF NOT v_winner_participant.is_bot AND v_winner_participant.user_id IS NOT NULL THEN
    -- Ajouter tous les items ouverts pendant la battle à l'inventaire du gagnant
    INSERT INTO user_inventory (user_id, item_id, box_id, obtained_from, obtained_at)
    SELECT
      v_winner_participant.user_id,
      bo.item_id,
      bo.loot_box_id,
      'battle'::text,
      now()
    FROM battle_openings bo
    WHERE bo.battle_id = p_battle_id;
  END IF;

  RETURN QUERY SELECT
    true,
    v_winner_participant.user_id,
    v_winner_participant.total_value::numeric,
    NULL::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. Fonction pour générer toutes les ouvertures d'une battle
-- =====================================================
CREATE OR REPLACE FUNCTION generate_all_battle_openings(
  p_battle_id uuid
)
RETURNS TABLE(
  success boolean,
  generated_count integer,
  error text
) AS $$
DECLARE
  v_battle record;
  v_box record;
  v_participant record;
  v_server_seed text;
  v_opening_result record;
  v_total_generated integer := 0;
  v_box_instance integer;
BEGIN
  -- Vérifier que la battle existe
  SELECT * INTO v_battle
  FROM battles
  WHERE id = p_battle_id;

  IF v_battle.id IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Battle not found'::text;
    RETURN;
  END IF;

  -- Vérifier qu'il n'y a pas déjà d'ouvertures
  IF EXISTS (
    SELECT 1 FROM battle_openings
    WHERE battle_id = p_battle_id
    LIMIT 1
  ) THEN
    RETURN QUERY SELECT false, 0, 'Openings already generated'::text;
    RETURN;
  END IF;

  -- Générer un server seed unique pour cette battle
  v_server_seed := encode(gen_random_bytes(32), 'hex');

  -- Pour chaque participant
  FOR v_participant IN (
    SELECT id, user_id, is_bot
    FROM battle_participants
    WHERE battle_id = p_battle_id
    ORDER BY joined_at ASC
  ) LOOP

    v_box_instance := 0;

    -- Pour chaque box de la battle
    FOR v_box IN (
      SELECT loot_box_id
      FROM battle_boxes
      WHERE battle_id = p_battle_id
      ORDER BY order_position ASC
    ) LOOP

      v_box_instance := v_box_instance + 1;

      -- Générer l'ouverture avec provably fair
      SELECT * INTO v_opening_result
      FROM process_battle_box_opening(
        p_battle_id,
        v_participant.id,
        v_box.loot_box_id,
        v_server_seed,
        NULL, -- client_seed auto-généré
        v_box_instance
      );

      IF v_opening_result.success THEN
        v_total_generated := v_total_generated + 1;
      ELSE
        RETURN QUERY SELECT false, v_total_generated, v_opening_result.error;
        RETURN;
      END IF;

    END LOOP;
  END LOOP;

  RETURN QUERY SELECT true, v_total_generated, NULL::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. Ajouter les colonnes manquantes si elles n'existent pas
-- =====================================================
DO $$
BEGIN
  -- Ajouter server_seed_hash à battle_openings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'battle_openings'
    AND column_name = 'server_seed_hash'
  ) THEN
    ALTER TABLE battle_openings ADD COLUMN server_seed_hash text;
  END IF;

  -- Ajouter client_seed à battle_openings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'battle_openings'
    AND column_name = 'client_seed'
  ) THEN
    ALTER TABLE battle_openings ADD COLUMN client_seed text;
  END IF;

  -- Ajouter participant_id à battle_openings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'battle_openings'
    AND column_name = 'participant_id'
  ) THEN
    ALTER TABLE battle_openings ADD COLUMN participant_id uuid REFERENCES battle_participants(id);
  END IF;

  -- Ajouter finished_at à battles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'battles'
    AND column_name = 'finished_at'
  ) THEN
    ALTER TABLE battles ADD COLUMN finished_at timestamptz;
  END IF;
END $$;

-- Commentaires
COMMENT ON FUNCTION process_battle_box_opening IS 'Ouvre une box dans une battle avec système provably fair utilisant server_seed et client_seed';
COMMENT ON FUNCTION finalize_battle IS 'Finalise une battle, détermine le gagnant et distribue les items';
COMMENT ON FUNCTION generate_all_battle_openings IS 'Pré-génère toutes les ouvertures d''une battle en une seule transaction pour garantir l''unicité et la cohérence';
