
-- 1) Tabela de carteira global
CREATE TABLE IF NOT EXISTS public.user_wallet_global (
  user_id text PRIMARY KEY,
  balance bigint NOT NULL DEFAULT 0 CHECK (balance >= 0),
  seeded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.user_wallet_global TO service_role;

ALTER TABLE public.user_wallet_global ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Wallet global apenas serviço" ON public.user_wallet_global;
CREATE POLICY "Wallet global apenas serviço"
  ON public.user_wallet_global FOR SELECT
  USING (false);

DROP TRIGGER IF EXISTS trg_user_wallet_global_updated ON public.user_wallet_global;
CREATE TRIGGER trg_user_wallet_global_updated
  BEFORE UPDATE ON public.user_wallet_global
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) Garantir/seeding lazy a partir das wallets por guild
CREATE OR REPLACE FUNCTION public.ensure_user_wallet_global(_user_id text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance bigint;
  v_seed bigint;
BEGIN
  SELECT balance INTO v_balance FROM public.user_wallet_global WHERE user_id = _user_id;
  IF FOUND THEN
    RETURN v_balance;
  END IF;

  SELECT COALESCE(SUM(balance + COALESCE(bank, 0))::bigint, 0)
    INTO v_seed
  FROM public.user_economy
  WHERE user_id = _user_id;

  INSERT INTO public.user_wallet_global (user_id, balance, seeded)
  VALUES (_user_id, v_seed, true)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING balance INTO v_balance;

  IF v_balance IS NULL THEN
    SELECT balance INTO v_balance FROM public.user_wallet_global WHERE user_id = _user_id;
  END IF;

  RETURN COALESCE(v_balance, 0);
END;
$$;

-- 3) Get saldo global
CREATE OR REPLACE FUNCTION public.get_user_global_balance(_user_id text)
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(balance, 0) FROM public.user_wallet_global WHERE user_id = _user_id
$$;

-- 4) Crédito no saldo global
CREATE OR REPLACE FUNCTION public.economy_credit_global(_user_id text, _amount bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new bigint;
BEGIN
  IF _amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  END IF;

  PERFORM public.ensure_user_wallet_global(_user_id);

  UPDATE public.user_wallet_global
     SET balance = balance + _amount,
         updated_at = now()
   WHERE user_id = _user_id
   RETURNING balance INTO v_new;

  RETURN jsonb_build_object('ok', true, 'balance', v_new);
END;
$$;

-- 5) Compra global de cosmético
CREATE OR REPLACE FUNCTION public.cosmetic_purchase_global(
  _user_id text,
  _cosmetic_id uuid,
  _use_discount boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cosmetic RECORD;
  v_price bigint;
  v_already boolean;
  v_rotation RECORD;
  v_discount int := 0;
  v_new_balance bigint;
BEGIN
  SELECT * INTO v_cosmetic FROM public.profile_cosmetics
   WHERE id = _cosmetic_id AND active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF v_cosmetic.available_from IS NOT NULL AND v_cosmetic.available_from > now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_available_yet');
  END IF;
  IF v_cosmetic.available_until IS NOT NULL AND v_cosmetic.available_until < now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.user_cosmetics
     WHERE user_id = _user_id AND cosmetic_id = _cosmetic_id
  ) INTO v_already;
  IF v_already THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_owned');
  END IF;

  v_price := v_cosmetic.price_coins;

  IF _use_discount THEN
    SELECT * INTO v_rotation FROM public.cosmetic_rotations WHERE rotation_date = CURRENT_DATE;
    IF FOUND AND _cosmetic_id = ANY(v_rotation.daily_offers) THEN
      v_discount := COALESCE(v_rotation.discount_percent, 0);
      v_price := (v_price * (100 - v_discount)) / 100;
    END IF;
  END IF;

  -- Item gratuito: insere direto
  IF v_price <= 0 THEN
    INSERT INTO public.user_cosmetics (user_id, cosmetic_id, source, metadata)
    VALUES (_user_id, _cosmetic_id, 'shop', jsonb_build_object('price_paid', 0, 'wallet', 'global'));
    PERFORM public.ensure_user_wallet_global(_user_id);
    SELECT balance INTO v_new_balance FROM public.user_wallet_global WHERE user_id = _user_id;
    RETURN jsonb_build_object('ok', true, 'price_paid', 0, 'discount', 0, 'new_balance', v_new_balance);
  END IF;

  -- Garante seed
  PERFORM public.ensure_user_wallet_global(_user_id);

  -- Débito atômico
  UPDATE public.user_wallet_global
     SET balance = balance - v_price,
         updated_at = now()
   WHERE user_id = _user_id
     AND balance >= v_price
  RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_funds', 'needed', v_price);
  END IF;

  INSERT INTO public.user_cosmetics (user_id, cosmetic_id, source, metadata)
  VALUES (_user_id, _cosmetic_id, 'shop',
    jsonb_build_object('price_paid', v_price, 'discount', v_discount, 'wallet', 'global'));

  RETURN jsonb_build_object(
    'ok', true,
    'price_paid', v_price,
    'discount', v_discount,
    'new_balance', v_new_balance
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_wallet_global(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_global_balance(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.economy_credit_global(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.cosmetic_purchase_global(text, uuid, boolean) TO service_role;
