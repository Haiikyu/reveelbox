-- 028_reevs_currency.sql
-- Système de monnaie bonus "Reevs" :
--   • reevs_balance sur profiles (INTEGER ≥ 0)
--   • Table d'audit reevs_transactions
--   • Colonnes reevs_price + stock sur les 5 tables shop
--   • Fonction award_reevs : 1 % cashback (floor) sur chaque dépense de coins
--   • Trigger automatique sur transactions (types dépense)
--   • Fonction buy_with_reevs : achat atomique avec SELECT FOR UPDATE

-- =========================================================
-- 1. Colonne reevs_balance sur profiles
-- =========================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reevs_balance INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS chk_reevs_balance_positive;

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_reevs_balance_positive CHECK (reevs_balance >= 0);

-- =========================================================
-- 2. Table d'audit reevs_transactions
-- =========================================================

CREATE TABLE IF NOT EXISTS public.reevs_transactions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount      INTEGER     NOT NULL,          -- positif = crédit, négatif = débit
  balance_after INTEGER   NOT NULL,          -- solde après l'opération
  reason      text        NOT NULL,          -- 'cashback', 'shop_purchase', 'admin_credit', …
  reference_id uuid,                         -- transaction.id ou shop_item.id source
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reevs_tx_user ON reevs_transactions (user_id, created_at DESC);

ALTER TABLE public.reevs_transactions ENABLE ROW LEVEL SECURITY;

-- Seul le propriétaire peut lire son historique
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'reevs_tx_select_owner' AND tablename = 'reevs_transactions') THEN
    CREATE POLICY reevs_tx_select_owner ON reevs_transactions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Les fonctions SECURITY DEFINER peuvent insérer (pas d'INSERT direct côté client)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'reevs_tx_insert_definer' AND tablename = 'reevs_transactions') THEN
    CREATE POLICY reevs_tx_insert_definer ON reevs_transactions
      FOR INSERT WITH CHECK (false);   -- bloque INSERT direct ; seules les fonctions DEFINER passent
  END IF;
END $$;

-- =========================================================
-- 3. Colonnes reevs_price + stock sur les tables shop
-- =========================================================

-- shop_frames
ALTER TABLE public.shop_frames
  ADD COLUMN IF NOT EXISTS reevs_price INTEGER,
  ADD COLUMN IF NOT EXISTS stock       INTEGER;

-- shop_banners
ALTER TABLE public.shop_banners
  ADD COLUMN IF NOT EXISTS reevs_price INTEGER,
  ADD COLUMN IF NOT EXISTS stock       INTEGER;

-- shop_pins
ALTER TABLE public.shop_pins
  ADD COLUMN IF NOT EXISTS reevs_price INTEGER,
  ADD COLUMN IF NOT EXISTS stock       INTEGER;

-- shop_name_colors
ALTER TABLE public.shop_name_colors
  ADD COLUMN IF NOT EXISTS reevs_price INTEGER,
  ADD COLUMN IF NOT EXISTS stock       INTEGER;

-- shop_backgrounds
ALTER TABLE public.shop_backgrounds
  ADD COLUMN IF NOT EXISTS reevs_price INTEGER,
  ADD COLUMN IF NOT EXISTS stock       INTEGER;

-- =========================================================
-- 4. Fonction award_reevs : crédite 1 % (floor) des coins dépensés
-- =========================================================

CREATE OR REPLACE FUNCTION public.award_reevs(
  p_user_id     uuid,
  p_coins_spent integer
) RETURNS integer   -- retourne les reevs crédités
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reevs      integer;
  v_new_balance integer;
BEGIN
  -- 1 % floor (minimum 0)
  v_reevs := GREATEST(0, FLOOR(p_coins_spent * 0.01)::integer);

  IF v_reevs <= 0 THEN
    RETURN 0;
  END IF;

  -- Créditer atomiquement
  UPDATE public.profiles
    SET reevs_balance = reevs_balance + v_reevs
  WHERE id = p_user_id
  RETURNING reevs_balance INTO v_new_balance;

  -- Audit
  INSERT INTO public.reevs_transactions
    (user_id, amount, balance_after, reason)
  VALUES
    (p_user_id, v_reevs, v_new_balance, 'cashback');

  RETURN v_reevs;
END;
$$;

-- =========================================================
-- 5. Trigger : cashback automatique sur dépenses de coins
-- =========================================================

CREATE OR REPLACE FUNCTION public.trigger_award_reevs_on_spend()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_spend integer;
BEGIN
  -- Seulement sur les types « dépense »
  IF NEW.type NOT IN ('box_opening', 'battle_entry', 'upgrade', 'mines_bet', 'crash_bet') THEN
    RETURN NEW;
  END IF;

  -- virtual_amount est négatif pour une dépense ; on prend la valeur absolue
  v_spend := ABS(COALESCE(NEW.virtual_amount, 0));

  IF v_spend > 0 AND NEW.user_id IS NOT NULL THEN
    PERFORM public.award_reevs(NEW.user_id, v_spend);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_reevs_on_spend ON public.transactions;
CREATE TRIGGER trg_award_reevs_on_spend
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_award_reevs_on_spend();

-- =========================================================
-- 6. Fonction buy_with_reevs : achat atomique sécurisé
-- =========================================================
-- p_item_type : 'frame' | 'banner' | 'pin' | 'name_color' | 'background'
-- Retourne un JSON avec { success, message, new_balance }

CREATE OR REPLACE FUNCTION public.buy_with_reevs(
  p_user_id  uuid,
  p_item_id  uuid,
  p_item_type text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reevs_price integer;
  v_stock       integer;
  v_balance     integer;
  v_new_balance integer;
  v_already_owned boolean := false;
BEGIN
  -- ---- Récupérer prix + stock avec FOR UPDATE (prévient la course) ----
  CASE p_item_type
    WHEN 'frame' THEN
      SELECT reevs_price, stock INTO v_reevs_price, v_stock
        FROM public.shop_frames WHERE id = p_item_id FOR UPDATE;
      SELECT EXISTS(SELECT 1 FROM public.user_frames  WHERE user_id = p_user_id AND frame_id  = p_item_id) INTO v_already_owned;
    WHEN 'banner' THEN
      SELECT reevs_price, stock INTO v_reevs_price, v_stock
        FROM public.shop_banners WHERE id = p_item_id FOR UPDATE;
      SELECT EXISTS(SELECT 1 FROM public.user_banners WHERE user_id = p_user_id AND banner_id = p_item_id) INTO v_already_owned;
    WHEN 'pin' THEN
      SELECT reevs_price, stock INTO v_reevs_price, v_stock
        FROM public.shop_pins WHERE id = p_item_id FOR UPDATE;
      SELECT EXISTS(SELECT 1 FROM public.user_pins   WHERE user_id = p_user_id AND pin_id    = p_item_id) INTO v_already_owned;
    WHEN 'name_color' THEN
      SELECT reevs_price, stock INTO v_reevs_price, v_stock
        FROM public.shop_name_colors WHERE id = p_item_id FOR UPDATE;
      SELECT EXISTS(SELECT 1 FROM public.user_name_colors WHERE user_id = p_user_id AND color_id = p_item_id) INTO v_already_owned;
    WHEN 'background' THEN
      SELECT reevs_price, stock INTO v_reevs_price, v_stock
        FROM public.shop_backgrounds WHERE id = p_item_id FOR UPDATE;
      SELECT EXISTS(SELECT 1 FROM public.user_backgrounds WHERE user_id = p_user_id AND background_id = p_item_id) INTO v_already_owned;
    ELSE
      RETURN jsonb_build_object('success', false, 'message', 'Type d''item invalide');
  END CASE;

  -- Vérifications
  IF v_reevs_price IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Item introuvable');
  END IF;
  IF v_reevs_price <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cet item n''est pas disponible contre des Reevs');
  END IF;
  IF v_already_owned THEN
    RETURN jsonb_build_object('success', false, 'message', 'Item déjà possédé');
  END IF;
  IF v_stock IS NOT NULL AND v_stock <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Stock épuisé');
  END IF;

  -- Solde utilisateur
  SELECT reevs_balance INTO v_balance FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF v_balance < v_reevs_price THEN
    RETURN jsonb_build_object('success', false, 'message', 'Solde Reevs insuffisant');
  END IF;

  -- Débiter le solde
  UPDATE public.profiles
    SET reevs_balance = reevs_balance - v_reevs_price
  WHERE id = p_user_id
  RETURNING reevs_balance INTO v_new_balance;

  -- Décrémenter stock si limité
  IF v_stock IS NOT NULL THEN
    CASE p_item_type
      WHEN 'frame'      THEN UPDATE public.shop_frames       SET stock = stock - 1 WHERE id = p_item_id;
      WHEN 'banner'     THEN UPDATE public.shop_banners      SET stock = stock - 1 WHERE id = p_item_id;
      WHEN 'pin'        THEN UPDATE public.shop_pins         SET stock = stock - 1 WHERE id = p_item_id;
      WHEN 'name_color' THEN UPDATE public.shop_name_colors  SET stock = stock - 1 WHERE id = p_item_id;
      WHEN 'background' THEN UPDATE public.shop_backgrounds  SET stock = stock - 1 WHERE id = p_item_id;
      ELSE NULL;
    END CASE;
  END IF;

  -- Attribuer l'item à l'utilisateur
  CASE p_item_type
    WHEN 'frame'      THEN INSERT INTO public.user_frames      (user_id, frame_id)       VALUES (p_user_id, p_item_id) ON CONFLICT DO NOTHING;
    WHEN 'banner'     THEN INSERT INTO public.user_banners     (user_id, banner_id)      VALUES (p_user_id, p_item_id) ON CONFLICT DO NOTHING;
    WHEN 'pin'        THEN INSERT INTO public.user_pins        (user_id, pin_id)         VALUES (p_user_id, p_item_id) ON CONFLICT DO NOTHING;
    WHEN 'name_color' THEN INSERT INTO public.user_name_colors (user_id, color_id)       VALUES (p_user_id, p_item_id) ON CONFLICT DO NOTHING;
    WHEN 'background' THEN INSERT INTO public.user_backgrounds (user_id, background_id)  VALUES (p_user_id, p_item_id) ON CONFLICT DO NOTHING;
    ELSE NULL;
  END CASE;

  -- Audit
  INSERT INTO public.reevs_transactions
    (user_id, amount, balance_after, reason, reference_id)
  VALUES
    (p_user_id, -v_reevs_price, v_new_balance, 'shop_purchase', p_item_id);

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Achat réussi',
    'new_balance', v_new_balance
  );
END;
$$;
