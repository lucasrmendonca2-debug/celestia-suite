
CREATE OR REPLACE FUNCTION public.economy_debit_wallet(
  _guild_id text,
  _user_id text,
  _amount bigint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance bigint;
BEGIN
  IF _amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  END IF;

  UPDATE public.user_economy
     SET balance = balance - _amount,
         updated_at = now()
   WHERE guild_id = _guild_id
     AND user_id = _user_id
     AND balance >= _amount
  RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_funds');
  END IF;

  RETURN jsonb_build_object('ok', true, 'balance', v_new_balance);
END;
$$;

CREATE OR REPLACE FUNCTION public.economy_credit_wallet(
  _guild_id text,
  _user_id text,
  _amount bigint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance bigint;
BEGIN
  IF _amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  END IF;

  INSERT INTO public.user_economy (guild_id, user_id, balance)
  VALUES (_guild_id, _user_id, _amount)
  ON CONFLICT (guild_id, user_id) DO UPDATE
     SET balance = public.user_economy.balance + EXCLUDED.balance,
         updated_at = now()
  RETURNING balance INTO v_new_balance;

  RETURN jsonb_build_object('ok', true, 'balance', v_new_balance);
END;
$$;

CREATE OR REPLACE FUNCTION public.economy_transfer_wallet(
  _guild_id text,
  _from_user_id text,
  _to_user_id text,
  _amount bigint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_balance bigint;
  v_to_balance bigint;
BEGIN
  IF _amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  END IF;
  IF _from_user_id = _to_user_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'same_user');
  END IF;

  UPDATE public.user_economy
     SET balance = balance - _amount,
         updated_at = now()
   WHERE guild_id = _guild_id
     AND user_id = _from_user_id
     AND balance >= _amount
  RETURNING balance INTO v_from_balance;

  IF v_from_balance IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_funds');
  END IF;

  INSERT INTO public.user_economy (guild_id, user_id, balance)
  VALUES (_guild_id, _to_user_id, _amount)
  ON CONFLICT (guild_id, user_id) DO UPDATE
     SET balance = public.user_economy.balance + EXCLUDED.balance,
         updated_at = now()
  RETURNING balance INTO v_to_balance;

  RETURN jsonb_build_object(
    'ok', true,
    'from_balance', v_from_balance,
    'to_balance', v_to_balance
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.economy_debit_wallet(text, text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.economy_credit_wallet(text, text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.economy_transfer_wallet(text, text, text, bigint) TO service_role;
