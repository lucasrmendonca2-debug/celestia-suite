-- Etapa A: RPCs atômicas para economia + capability can_manage_appeals

-- 1) Cooldown atômico genérico (daily / work / crime / rob)
CREATE OR REPLACE FUNCTION public.economy_claim_cooldown(
  _guild_id text,
  _user_id  text,
  _field    text,
  _cooldown_seconds int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count int;
BEGIN
  INSERT INTO public.user_economy (guild_id, user_id)
  VALUES (_guild_id, _user_id)
  ON CONFLICT (guild_id, user_id) DO NOTHING;

  IF _field = 'last_daily_at' THEN
    UPDATE public.user_economy SET last_daily_at = now(), updated_at = now()
     WHERE guild_id = _guild_id AND user_id = _user_id
       AND (last_daily_at IS NULL OR last_daily_at <= now() - make_interval(secs => _cooldown_seconds));
  ELSIF _field = 'last_work_at' THEN
    UPDATE public.user_economy SET last_work_at = now(), updated_at = now()
     WHERE guild_id = _guild_id AND user_id = _user_id
       AND (last_work_at IS NULL OR last_work_at <= now() - make_interval(secs => _cooldown_seconds));
  ELSIF _field = 'last_crime_at' THEN
    UPDATE public.user_economy SET last_crime_at = now(), updated_at = now()
     WHERE guild_id = _guild_id AND user_id = _user_id
       AND (last_crime_at IS NULL OR last_crime_at <= now() - make_interval(secs => _cooldown_seconds));
  ELSIF _field = 'last_rob_at' THEN
    UPDATE public.user_economy SET last_rob_at = now(), updated_at = now()
     WHERE guild_id = _guild_id AND user_id = _user_id
       AND (last_rob_at IS NULL OR last_rob_at <= now() - make_interval(secs => _cooldown_seconds));
  ELSE
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_field');
  END IF;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    RETURN jsonb_build_object('ok', true);
  END IF;
  RETURN jsonb_build_object('ok', false, 'reason', 'cooldown_active');
END $$;

-- 2) Compra atômica na loja: valida estoque + debita saldo num único bloco.
CREATE OR REPLACE FUNCTION public.shop_buy_atomic(
  _guild_id   text,
  _user_id    text,
  _item_id    uuid,
  _qty        int,
  _unit_price bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_total       bigint;
  v_stock       int;
  v_new_balance bigint;
  v_item        RECORD;
  v_count       int;
BEGIN
  IF _qty <= 0 OR _unit_price < 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_input');
  END IF;
  v_total := _unit_price * _qty;

  SELECT * INTO v_item FROM public.shop_items WHERE id = _item_id AND guild_id = _guild_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF v_item.enabled IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'disabled');
  END IF;

  -- Estoque (NULL = ilimitado; -1 também tratado como ilimitado por compat)
  IF v_item.stock IS NOT NULL AND v_item.stock <> -1 THEN
    UPDATE public.shop_items
       SET stock = stock - _qty, updated_at = now()
     WHERE id = _item_id AND stock >= _qty
     RETURNING stock INTO v_stock;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'out_of_stock');
    END IF;
  END IF;

  -- Saldo
  INSERT INTO public.user_economy (guild_id, user_id)
  VALUES (_guild_id, _user_id)
  ON CONFLICT (guild_id, user_id) DO NOTHING;

  UPDATE public.user_economy
     SET balance = balance - v_total, updated_at = now()
   WHERE guild_id = _guild_id AND user_id = _user_id AND balance >= v_total
   RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    -- devolve estoque
    IF v_item.stock IS NOT NULL AND v_item.stock <> -1 THEN
      UPDATE public.shop_items SET stock = stock + _qty, updated_at = now() WHERE id = _item_id;
    END IF;
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_funds', 'needed', v_total);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'new_balance', v_new_balance,
    'total_paid', v_total,
    'stock', v_stock,
    'item', jsonb_build_object('id', v_item.id, 'name', v_item.name, 'role_id', v_item.role_id, 'type', v_item.type)
  );
END $$;

-- 3) Daily claim atômico: trava cooldown + credita saldo + atualiza streak.
CREATE OR REPLACE FUNCTION public.daily_claim_atomic(
  _guild_id          text,
  _user_id           text,
  _cooldown_seconds  int,
  _expected_streak   int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_prev_last  timestamptz;
  v_count      int;
BEGIN
  -- Garante linha
  INSERT INTO public.user_economy (guild_id, user_id)
  VALUES (_guild_id, _user_id)
  ON CONFLICT (guild_id, user_id) DO NOTHING;

  SELECT last_daily_at INTO v_prev_last FROM public.user_economy
   WHERE guild_id = _guild_id AND user_id = _user_id;

  UPDATE public.user_economy
     SET last_daily_at = now(),
         updated_at = now()
   WHERE guild_id = _guild_id AND user_id = _user_id
     AND (last_daily_at IS NULL OR last_daily_at <= now() - make_interval(secs => _cooldown_seconds));

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'cooldown_active', 'next_at', v_prev_last + make_interval(secs => _cooldown_seconds));
  END IF;

  RETURN jsonb_build_object('ok', true, 'prev_last_daily_at', v_prev_last, 'streak', _expected_streak);
END $$;

-- 4) XP atômico
CREATE OR REPLACE FUNCTION public.level_add_xp(
  _guild_id text,
  _user_id  text,
  _amount   int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_xp   int;
  v_total bigint;
BEGIN
  IF _amount = 0 THEN
    RETURN jsonb_build_object('ok', true, 'xp', 0, 'total_xp', 0);
  END IF;

  INSERT INTO public.level_users (guild_id, user_id, xp, total_xp, last_xp_at)
  VALUES (_guild_id, _user_id, GREATEST(0, _amount), GREATEST(0, _amount), now())
  ON CONFLICT (guild_id, user_id) DO UPDATE
     SET xp        = GREATEST(0, public.level_users.xp + _amount),
         total_xp  = GREATEST(0, public.level_users.total_xp + _amount),
         last_xp_at = now(),
         updated_at = now()
  RETURNING xp, total_xp INTO v_xp, v_total;

  RETURN jsonb_build_object('ok', true, 'xp', v_xp, 'total_xp', v_total);
END $$;

-- 5) Nova capability para apelações
ALTER TABLE public.moderation_permission_roles
  ADD COLUMN IF NOT EXISTS can_manage_appeals boolean NOT NULL DEFAULT false;

-- Grants nos novos RPCs
GRANT EXECUTE ON FUNCTION public.economy_claim_cooldown(text, text, text, int) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.shop_buy_atomic(text, text, uuid, int, bigint) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.daily_claim_atomic(text, text, int, int) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.level_add_xp(text, text, int) TO authenticated, service_role;
