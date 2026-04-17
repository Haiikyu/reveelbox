-- 029_fix_buy_rpcs_award_reevs.sql
-- Ajoute l'appel à award_reevs() dans les 5 fonctions buy_xxx
-- pour créditer 1% de cashback Reevs lors d'achats avec coins

-- =====================
-- buy_pin
-- =====================
CREATE OR REPLACE FUNCTION public.buy_pin(p_user_id uuid, p_pin_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  pin_price   INTEGER;
  user_balance NUMERIC;
BEGIN
  SELECT price INTO pin_price FROM shop_pins WHERE id = p_pin_id;
  IF pin_price IS NULL THEN
    RAISE EXCEPTION 'Pin introuvable';
  END IF;

  IF EXISTS (SELECT 1 FROM user_pins WHERE user_id = p_user_id AND pin_id = p_pin_id) THEN
    RAISE EXCEPTION 'Pin déjà possédé';
  END IF;

  SELECT virtual_currency INTO user_balance FROM profiles WHERE id = p_user_id;
  IF user_balance < pin_price THEN
    RAISE EXCEPTION 'Solde insuffisant';
  END IF;

  UPDATE profiles SET virtual_currency = virtual_currency - pin_price WHERE id = p_user_id;
  INSERT INTO user_pins (user_id, pin_id) VALUES (p_user_id, p_pin_id);

  -- Cashback Reevs (1%)
  IF pin_price > 0 THEN
    PERFORM public.award_reevs(p_user_id, pin_price);
  END IF;

  RETURN TRUE;
END;
$$;

-- =====================
-- buy_banner
-- =====================
CREATE OR REPLACE FUNCTION public.buy_banner(p_user_id uuid, p_banner_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  banner_price INTEGER;
  user_balance NUMERIC;
BEGIN
  SELECT price INTO banner_price FROM shop_banners WHERE id = p_banner_id;
  IF banner_price IS NULL THEN
    RAISE EXCEPTION 'Bannière introuvable';
  END IF;

  IF EXISTS (SELECT 1 FROM user_banners WHERE user_id = p_user_id AND banner_id = p_banner_id) THEN
    RAISE EXCEPTION 'Bannière déjà possédée';
  END IF;

  SELECT virtual_currency INTO user_balance FROM profiles WHERE id = p_user_id;
  IF user_balance < banner_price THEN
    RAISE EXCEPTION 'Solde insuffisant';
  END IF;

  UPDATE profiles SET virtual_currency = virtual_currency - banner_price WHERE id = p_user_id;
  INSERT INTO user_banners (user_id, banner_id) VALUES (p_user_id, p_banner_id);

  -- Cashback Reevs (1%)
  IF banner_price > 0 THEN
    PERFORM public.award_reevs(p_user_id, banner_price);
  END IF;

  RETURN TRUE;
END;
$$;

-- =====================
-- buy_frame
-- =====================
CREATE OR REPLACE FUNCTION public.buy_frame(p_user_id uuid, p_frame_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  frame_price  INTEGER;
  user_balance NUMERIC;
BEGIN
  SELECT price INTO frame_price FROM shop_frames WHERE id = p_frame_id;
  IF frame_price IS NULL THEN
    RAISE EXCEPTION 'Cadre introuvable';
  END IF;

  IF EXISTS (SELECT 1 FROM user_frames WHERE user_id = p_user_id AND frame_id = p_frame_id) THEN
    RAISE EXCEPTION 'Cadre déjà possédé';
  END IF;

  SELECT virtual_currency INTO user_balance FROM profiles WHERE id = p_user_id;
  IF user_balance < frame_price THEN
    RAISE EXCEPTION 'Solde insuffisant';
  END IF;

  UPDATE profiles SET virtual_currency = virtual_currency - frame_price WHERE id = p_user_id;
  INSERT INTO user_frames (user_id, frame_id) VALUES (p_user_id, p_frame_id);

  -- Cashback Reevs (1%)
  IF frame_price > 0 THEN
    PERFORM public.award_reevs(p_user_id, frame_price);
  END IF;

  RETURN TRUE;
END;
$$;

-- =====================
-- buy_name_color
-- =====================
CREATE OR REPLACE FUNCTION public.buy_name_color(p_user_id uuid, p_color_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_price  int;
  v_balance int;
BEGIN
  IF EXISTS (SELECT 1 FROM user_name_colors WHERE user_id = p_user_id AND color_id = p_color_id) THEN
    RAISE EXCEPTION 'Vous possedez deja cette couleur';
  END IF;

  SELECT price INTO v_price FROM shop_name_colors WHERE id = p_color_id;
  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Couleur introuvable';
  END IF;

  SELECT virtual_currency INTO v_balance FROM profiles WHERE id = p_user_id;
  IF v_balance < v_price THEN
    RAISE EXCEPTION 'Solde insuffisant';
  END IF;

  UPDATE profiles SET virtual_currency = virtual_currency - v_price WHERE id = p_user_id;
  INSERT INTO user_name_colors (user_id, color_id, is_equipped) VALUES (p_user_id, p_color_id, false);

  -- Cashback Reevs (1%)
  IF v_price > 0 THEN
    PERFORM public.award_reevs(p_user_id, v_price);
  END IF;
END;
$$;

-- =====================
-- buy_background
-- =====================
CREATE OR REPLACE FUNCTION public.buy_background(p_user_id uuid, p_background_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_price   integer;
  v_balance integer;
BEGIN
  IF EXISTS (SELECT 1 FROM user_backgrounds WHERE user_id = p_user_id AND background_id = p_background_id) THEN
    RAISE EXCEPTION 'Background déjà possédé';
  END IF;

  SELECT price INTO v_price FROM shop_backgrounds WHERE id = p_background_id;
  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Background introuvable';
  END IF;

  SELECT virtual_currency INTO v_balance FROM profiles WHERE id = p_user_id;
  IF v_balance < v_price THEN
    RAISE EXCEPTION 'Solde insuffisant';
  END IF;

  UPDATE profiles SET virtual_currency = virtual_currency - v_price WHERE id = p_user_id;
  INSERT INTO user_backgrounds (user_id, background_id) VALUES (p_user_id, p_background_id);

  -- Cashback Reevs (1%)
  IF v_price > 0 THEN
    PERFORM public.award_reevs(p_user_id, v_price);
  END IF;
END;
$$;
