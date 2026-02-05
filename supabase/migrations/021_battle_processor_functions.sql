-- Migration: Battle Processor Functions
-- Updates finalize_battle to support team modes (2v2, 3v3) and crazy mode
-- Updates generate_all_battle_openings to store server_seed

-- =====================================================
-- 1. Update generate_all_battle_openings to save server_seed to battle
-- =====================================================
DROP FUNCTION IF EXISTS generate_all_battle_openings(uuid);

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
  v_client_seed text;
  v_opening_result record;
  v_total_generated integer := 0;
  v_box_instance integer;
  v_box_order integer := 0;
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

  -- Use server_seed from battle if already set, otherwise generate one
  IF v_battle.server_seed IS NOT NULL THEN
    v_server_seed := v_battle.server_seed;
  ELSE
    v_server_seed := encode(gen_random_bytes(32), 'hex');
    -- Save server_seed to battle
    UPDATE battles
    SET
      server_seed = v_server_seed,
      combined_hash = encode(digest(v_server_seed, 'sha256'), 'hex')
    WHERE id = p_battle_id;
  END IF;

  -- Use or generate client_seed
  v_client_seed := COALESCE(v_battle.client_seed, encode(gen_random_bytes(16), 'hex'));
  IF v_battle.client_seed IS NULL THEN
    UPDATE battles SET client_seed = v_client_seed WHERE id = p_battle_id;
  END IF;

  -- Pour chaque box de la battle (in order)
  FOR v_box IN (
    SELECT bb.loot_box_id, bb.quantity, bb.order_position
    FROM battle_boxes bb
    WHERE bb.battle_id = p_battle_id
    ORDER BY bb.order_position ASC
  ) LOOP

    -- For each instance of this box type
    FOR v_box_instance IN 1..v_box.quantity LOOP
      v_box_order := v_box_order + 1;

      -- Pour chaque participant
      FOR v_participant IN (
        SELECT id, user_id, is_bot, position
        FROM battle_participants
        WHERE battle_id = p_battle_id
        ORDER BY position ASC
      ) LOOP

        -- Generate unique seed for this opening
        -- seed = server_seed + client_seed + battle_id + box_order + participant_position
        DECLARE
          v_combined_seed text;
          v_combined_hash text;
          v_random_value numeric;
          v_total_probability numeric;
          v_cumulative_probability numeric;
          v_selected_item record;
        BEGIN
          v_combined_seed := v_server_seed || v_client_seed || p_battle_id::text || v_box_order::text || v_participant.position::text;
          v_combined_hash := encode(digest(v_combined_seed, 'sha256'), 'hex');

          -- Convert hash to random value (0-1)
          v_random_value := ('x' || substring(v_combined_hash, 1, 8))::bit(32)::bigint::numeric / 4294967295.0;

          -- Get total probability
          SELECT SUM(probability) INTO v_total_probability
          FROM loot_box_items
          WHERE loot_box_id = v_box.loot_box_id;

          IF v_total_probability IS NULL OR v_total_probability = 0 THEN
            RAISE EXCEPTION 'No items in box %', v_box.loot_box_id;
          END IF;

          -- Select item based on probability
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
            WHERE lbi.loot_box_id = v_box.loot_box_id
            ORDER BY lbi.probability DESC
          ) LOOP
            v_cumulative_probability := v_cumulative_probability + v_selected_item.probability;

            IF v_random_value <= v_cumulative_probability THEN
              -- Insert the opening
              INSERT INTO battle_openings (
                battle_id,
                participant_id,
                loot_box_id,
                item_id,
                item_value,
                item_rarity,
                box_order,
                box_instance,
                server_seed_hash,
                client_seed,
                opened_at
              ) VALUES (
                p_battle_id,
                v_participant.id,
                v_box.loot_box_id,
                v_selected_item.item_id,
                v_selected_item.market_value,
                v_selected_item.rarity,
                v_box_order,
                v_box_instance,
                encode(digest(v_server_seed, 'sha256'), 'hex'),
                v_client_seed,
                now()
              );

              -- Update participant total_value
              UPDATE battle_participants
              SET total_value = COALESCE(total_value, 0) + v_selected_item.market_value
              WHERE id = v_participant.id;

              v_total_generated := v_total_generated + 1;
              EXIT; -- Exit the item loop
            END IF;
          END LOOP;
        END;

      END LOOP; -- participants
    END LOOP; -- box instances
  END LOOP; -- battle boxes

  RETURN QUERY SELECT true, v_total_generated, NULL::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. Update finalize_battle to support team modes and crazy mode
-- =====================================================
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
  v_battle record;
  v_is_team_mode boolean;
  v_is_crazy_mode boolean;
  v_winning_team integer;
  v_team_scores jsonb;
  v_winner_participant record;
  v_items_added integer := 0;
  v_total_pool numeric := 0;
  v_share_per_player numeric := 0;
  v_winning_team_count integer := 0;
BEGIN
  -- Fetch battle info
  SELECT
    id, status, mode, player_distribution,
    (player_distribution IN ('2v2', '3v3')) as is_team,
    (mode = 'crazy') as is_crazy
  INTO v_battle
  FROM battles
  WHERE id = p_battle_id;

  IF v_battle.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::numeric, 'Battle not found'::text;
    RETURN;
  END IF;

  -- Check if already finished
  IF v_battle.status = 'finished' THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::numeric, 'Battle already finished'::text;
    RETURN;
  END IF;

  v_is_team_mode := v_battle.is_team;
  v_is_crazy_mode := v_battle.is_crazy;

  IF v_is_team_mode THEN
    -- =====================================================
    -- TEAM MODE (2v2, 3v3)
    -- =====================================================

    -- Calculate team scores
    WITH team_totals AS (
      SELECT
        bp.team,
        SUM(bp.total_value) as team_total,
        COUNT(*) as player_count
      FROM battle_participants bp
      WHERE bp.battle_id = p_battle_id
        AND bp.team IS NOT NULL
      GROUP BY bp.team
    )
    SELECT
      CASE
        WHEN v_is_crazy_mode THEN
          -- Crazy mode: lowest score wins
          (SELECT team FROM team_totals ORDER BY team_total ASC LIMIT 1)
        ELSE
          -- Normal mode: highest score wins
          (SELECT team FROM team_totals ORDER BY team_total DESC LIMIT 1)
      END,
      jsonb_object_agg(team, team_total)
    INTO v_winning_team, v_team_scores
    FROM team_totals;

    RAISE NOTICE 'Team mode - Winning team: %, Scores: %, Crazy: %', v_winning_team, v_team_scores, v_is_crazy_mode;

    -- Calculate total pool (all players)
    SELECT COALESCE(SUM(total_value), 0) INTO v_total_pool
    FROM battle_participants
    WHERE battle_id = p_battle_id;

    -- Count winning team players
    SELECT COUNT(*) INTO v_winning_team_count
    FROM battle_participants
    WHERE battle_id = p_battle_id AND team = v_winning_team;

    IF v_winning_team_count > 0 THEN
      v_share_per_player := v_total_pool / v_winning_team_count;
    END IF;

    -- Mark winners on winning team
    UPDATE battle_participants
    SET is_winner = true, final_rank = 1
    WHERE battle_id = p_battle_id AND team = v_winning_team;

    -- Mark losers
    UPDATE battle_participants
    SET is_winner = false, final_rank = 2
    WHERE battle_id = p_battle_id AND team != v_winning_team;

    -- Distribute items to winning team players
    -- Each player gets an item worth up to their share, plus coins for remainder
    FOR v_winner_participant IN (
      SELECT id, user_id, is_bot
      FROM battle_participants
      WHERE battle_id = p_battle_id
        AND team = v_winning_team
        AND NOT is_bot
        AND user_id IS NOT NULL
    ) LOOP
      -- Find closest item worth <= share
      DECLARE
        v_closest_item record;
        v_coins_balance numeric;
      BEGIN
        SELECT id, market_value INTO v_closest_item
        FROM items
        WHERE market_value <= v_share_per_player
        ORDER BY market_value DESC
        LIMIT 1;

        IF v_closest_item.id IS NOT NULL THEN
          -- Add item to inventory
          INSERT INTO user_inventory (user_id, item_id, obtained_from, obtained_at)
          VALUES (v_winner_participant.user_id, v_closest_item.id, 'battle', now());

          v_items_added := v_items_added + 1;
          v_coins_balance := v_share_per_player - v_closest_item.market_value;
        ELSE
          v_coins_balance := v_share_per_player;
        END IF;

        -- Add remaining coins to balance
        IF v_coins_balance > 0 THEN
          UPDATE profiles
          SET virtual_currency = COALESCE(virtual_currency, 0) + FLOOR(v_coins_balance)
          WHERE id = v_winner_participant.user_id;
        END IF;
      END;
    END LOOP;

    -- Update battle status (no single winner_user_id for team mode)
    UPDATE battles
    SET
      status = 'finished',
      winner_user_id = NULL,
      finished_at = now()
    WHERE id = p_battle_id;

    RETURN QUERY SELECT true, NULL::uuid, v_total_pool, NULL::text;

  ELSE
    -- =====================================================
    -- FREE-FOR-ALL MODE (1v1, 1v1v1, etc)
    -- =====================================================

    -- Find winner based on mode
    IF v_is_crazy_mode THEN
      -- Crazy mode: lowest value wins
      SELECT id, user_id, total_value, is_bot
      INTO v_winner_participant
      FROM battle_participants
      WHERE battle_id = p_battle_id
      ORDER BY total_value ASC, joined_at ASC
      LIMIT 1;
    ELSE
      -- Normal mode: highest value wins
      SELECT id, user_id, total_value, is_bot
      INTO v_winner_participant
      FROM battle_participants
      WHERE battle_id = p_battle_id
      ORDER BY total_value DESC, joined_at ASC
      LIMIT 1;
    END IF;

    IF v_winner_participant.id IS NULL THEN
      RETURN QUERY SELECT false, NULL::uuid, NULL::numeric, 'No participants found'::text;
      RETURN;
    END IF;

    RAISE NOTICE 'FFA mode - Winner: %, Value: %, Crazy: %', v_winner_participant.user_id, v_winner_participant.total_value, v_is_crazy_mode;

    -- Mark winner
    UPDATE battle_participants
    SET is_winner = true, final_rank = 1
    WHERE id = v_winner_participant.id;

    -- Mark others as losers
    UPDATE battle_participants
    SET is_winner = false, final_rank = 2
    WHERE battle_id = p_battle_id AND id != v_winner_participant.id;

    -- Update battle status
    UPDATE battles
    SET
      status = 'finished',
      winner_user_id = v_winner_participant.user_id,
      finished_at = now()
    WHERE id = p_battle_id;

    -- If winner is not a bot, add ALL items to inventory
    IF NOT v_winner_participant.is_bot AND v_winner_participant.user_id IS NOT NULL THEN
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

    RETURN QUERY SELECT true, v_winner_participant.user_id, v_winner_participant.total_value::numeric, NULL::text;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. Add box_order column to battle_openings if not exists
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'battle_openings'
    AND column_name = 'box_order'
  ) THEN
    ALTER TABLE battle_openings ADD COLUMN box_order integer DEFAULT 1;
    COMMENT ON COLUMN battle_openings.box_order IS 'Sequential order of box opening (1, 2, 3...)';
  END IF;
END $$;

-- =====================================================
-- 4. Add current_box column to battles if not exists
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'battles'
    AND column_name = 'current_box'
  ) THEN
    ALTER TABLE battles ADD COLUMN current_box integer DEFAULT 0;
    COMMENT ON COLUMN battles.current_box IS 'Current box being opened (for real-time sync)';
  END IF;
END $$;

-- =====================================================
-- 5. Create index on battle_openings for efficient queries
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_battle_openings_battle_box
ON battle_openings(battle_id, box_order);

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON FUNCTION generate_all_battle_openings IS 'Pre-generates all battle openings using provably fair RNG. Stores server_seed in battle.';
COMMENT ON FUNCTION finalize_battle IS 'Finalizes battle, supports team modes (2v2, 3v3) and crazy mode (lowest wins).';
