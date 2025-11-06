-- Migration: Fix Mines Game to use virtual_currency instead of coins_balance
-- Description: Update all Mines game functions to use the correct balance field

-- Function: Start Mines Game (Fixed to use virtual_currency)
DROP FUNCTION IF EXISTS start_mines_game(UUID, DECIMAL, INTEGER);
CREATE FUNCTION start_mines_game(
    p_user_id UUID,
    p_bet_amount DECIMAL,
    p_bomb_count INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_balance DECIMAL;
    v_game_id UUID;
    v_bomb_positions INTEGER[];
BEGIN
    -- Validate inputs
    IF p_bet_amount <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Le montant de la mise doit être positif'
        );
    END IF;

    IF p_bomb_count < 1 OR p_bomb_count > 24 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Le nombre de bombes doit être entre 1 et 24'
        );
    END IF;

    -- Check user balance using virtual_currency
    SELECT virtual_currency INTO v_balance
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_balance IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Utilisateur non trouvé'
        );
    END IF;

    IF v_balance < p_bet_amount THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Solde insuffisant'
        );
    END IF;

    -- Check for existing active game
    IF EXISTS (
        SELECT 1 FROM public.mines_games
        WHERE user_id = p_user_id AND status = 'in_progress'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Vous avez déjà une partie en cours'
        );
    END IF;

    -- Generate random bomb positions (0-24)
    v_bomb_positions := ARRAY(
        SELECT pos FROM generate_series(0, 24) pos
        ORDER BY random()
        LIMIT p_bomb_count
    );

    -- Deduct bet amount from balance using virtual_currency
    UPDATE public.profiles
    SET virtual_currency = virtual_currency - p_bet_amount
    WHERE id = p_user_id;

    -- Create game
    INSERT INTO public.mines_games (
        user_id,
        bet_amount,
        bomb_count,
        status,
        bomb_positions,
        profit_loss
    ) VALUES (
        p_user_id,
        p_bet_amount,
        p_bomb_count,
        'in_progress',
        v_bomb_positions,
        -p_bet_amount
    )
    RETURNING id INTO v_game_id;

    -- Record transaction
    INSERT INTO public.transactions (
        user_id,
        transaction_type,
        amount,
        description
    ) VALUES (
        p_user_id,
        'game_bet',
        -p_bet_amount,
        'Mise Mines: ' || p_bomb_count || ' bombes'
    );

    RETURN json_build_object(
        'success', true,
        'game_id', v_game_id,
        'message', 'Partie démarrée'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reveal Mines Box (Updated to use virtual_currency)
DROP FUNCTION IF EXISTS reveal_mines_box(UUID, INTEGER);
CREATE FUNCTION reveal_mines_box(
    p_game_id UUID,
    p_box_index INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_game RECORD;
    v_is_bomb BOOLEAN;
    v_multiplier DECIMAL;
    v_win_amount DECIMAL;
    v_game_over BOOLEAN := false;
    v_new_status TEXT;
    v_all_safe_revealed BOOLEAN;
BEGIN
    -- Validate box index
    IF p_box_index < 0 OR p_box_index > 24 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Index de boîte invalide'
        );
    END IF;

    -- Get game data
    SELECT * INTO v_game
    FROM public.mines_games
    WHERE id = p_game_id AND status = 'in_progress';

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Partie non trouvée ou déjà terminée'
        );
    END IF;

    -- Check if box already revealed
    IF p_box_index = ANY(v_game.revealed_positions) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Cette boîte a déjà été révélée'
        );
    END IF;

    -- Check if it's a bomb
    v_is_bomb := p_box_index = ANY(v_game.bomb_positions);

    IF v_is_bomb THEN
        -- Game lost
        v_game_over := true;
        v_new_status := 'lost';
        v_multiplier := 0;
        v_win_amount := 0;

        UPDATE public.mines_games
        SET
            status = 'lost',
            revealed_positions = array_append(revealed_positions, p_box_index),
            boxes_revealed = boxes_revealed + 1,
            finished_at = NOW(),
            duration_seconds = EXTRACT(EPOCH FROM (NOW() - created_at))::INTEGER,
            final_multiplier = 0,
            win_amount = 0
        WHERE id = p_game_id;

    ELSE
        -- Safe box revealed
        UPDATE public.mines_games
        SET
            revealed_positions = array_append(revealed_positions, p_box_index),
            boxes_revealed = boxes_revealed + 1
        WHERE id = p_game_id
        RETURNING * INTO v_game;

        -- Calculate new multiplier
        v_multiplier := calculate_mines_multiplier(v_game.boxes_revealed, v_game.bomb_count);
        v_win_amount := v_game.bet_amount * v_multiplier;

        -- Check if all safe boxes revealed (auto-win)
        v_all_safe_revealed := v_game.boxes_revealed >= (25 - v_game.bomb_count);

        IF v_all_safe_revealed THEN
            v_game_over := true;
            v_new_status := 'won';

            -- Update game and add winnings using virtual_currency
            UPDATE public.mines_games
            SET
                status = 'won',
                finished_at = NOW(),
                duration_seconds = EXTRACT(EPOCH FROM (NOW() - created_at))::INTEGER,
                final_multiplier = v_multiplier,
                win_amount = v_win_amount,
                profit_loss = v_win_amount - bet_amount
            WHERE id = p_game_id;

            UPDATE public.profiles
            SET virtual_currency = virtual_currency + v_win_amount
            WHERE id = v_game.user_id;

            -- Record transaction
            INSERT INTO public.transactions (
                user_id,
                transaction_type,
                amount,
                description
            ) VALUES (
                v_game.user_id,
                'game_win',
                v_win_amount,
                'Victoire Mines: ' || v_game.boxes_revealed || ' boîtes révélées'
            );
        ELSE
            -- Update multiplier
            UPDATE public.mines_games
            SET
                final_multiplier = v_multiplier,
                win_amount = v_win_amount
            WHERE id = p_game_id;

            v_new_status := 'in_progress';
        END IF;
    END IF;

    RETURN json_build_object(
        'success', true,
        'is_bomb', v_is_bomb,
        'game_over', v_game_over,
        'status', v_new_status,
        'multiplier', v_multiplier,
        'win_amount', v_win_amount,
        'boxes_revealed', v_game.boxes_revealed
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cash Out Mines Game (Updated to use virtual_currency)
DROP FUNCTION IF EXISTS cash_out_mines_game(UUID);
CREATE FUNCTION cash_out_mines_game(
    p_game_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_game RECORD;
    v_profit DECIMAL;
BEGIN
    -- Get game data
    SELECT * INTO v_game
    FROM public.mines_games
    WHERE id = p_game_id AND status = 'in_progress';

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Partie non trouvée ou déjà terminée'
        );
    END IF;

    -- Must have revealed at least one box
    IF v_game.boxes_revealed = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Vous devez révéler au moins une boîte'
        );
    END IF;

    v_profit := v_game.win_amount - v_game.bet_amount;

    -- Update game status
    UPDATE public.mines_games
    SET
        status = 'cashed_out',
        finished_at = NOW(),
        duration_seconds = EXTRACT(EPOCH FROM (NOW() - created_at))::INTEGER,
        profit_loss = v_profit
    WHERE id = p_game_id;

    -- Add winnings to balance using virtual_currency
    UPDATE public.profiles
    SET virtual_currency = virtual_currency + v_game.win_amount
    WHERE id = v_game.user_id;

    -- Record transaction
    INSERT INTO public.transactions (
        user_id,
        transaction_type,
        amount,
        description
    ) VALUES (
        v_game.user_id,
        'game_win',
        v_game.win_amount,
        'Encaissement Mines: ' || v_game.boxes_revealed || ' boîtes révélées (x' || v_game.final_multiplier || ')'
    );

    RETURN json_build_object(
        'success', true,
        'status', 'cashed_out',
        'win_amount', v_game.win_amount,
        'profit', v_profit,
        'multiplier', v_game.final_multiplier
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION start_mines_game TO authenticated;
GRANT EXECUTE ON FUNCTION reveal_mines_box TO authenticated;
GRANT EXECUTE ON FUNCTION cash_out_mines_game TO authenticated;
