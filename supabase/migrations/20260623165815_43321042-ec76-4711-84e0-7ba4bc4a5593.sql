CREATE OR REPLACE FUNCTION public.economy_bank_transfer(
  _guild_id text,
  _user_id text,
  _amount bigint,
  _direction text -- 'deposit' (wallet->bank) | 'withdraw' (bank->wallet)
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.user_economy%ROWTYPE;
  v_count int;
BEGIN
  IF _amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  END IF;

  INSERT INTO public.user_economy (guild_id, user_id)
  VALUES (_guild_id, _user_id)
  ON CONFLICT (guild_id, user_id) DO NOTHING;

  IF _direction = 'deposit' THEN
    UPDATE public.user_economy
       SET balance = balance - _amount,
           bank = bank + _amount,
           updated_at = now()
     WHERE guild_id = _guild_id
       AND user_id = _user_id
       AND balance >= _amount
       AND (bank_cap IS NULL OR bank + _amount <= bank_cap)
     RETURNING * INTO v_row;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count = 0 THEN
      SELECT * INTO v_row FROM public.user_economy
        WHERE guild_id = _guild_id AND user_id = _user_id;
      IF v_row.balance < _amount THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_funds');
      END IF;
      RETURN jsonb_build_object('ok', false, 'reason', 'bank_cap_exceeded',
        'bank_cap', v_row.bank_cap, 'bank', v_row.bank);
    END IF;
  ELSIF _direction = 'withdraw' THEN
    UPDATE public.user_economy
       SET bank = bank - _amount,
           balance = balance + _amount,
           updated_at = now()
     WHERE guild_id = _guild_id
       AND user_id = _user_id
       AND bank >= _amount
     RETURNING * INTO v_row;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count = 0 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_bank');
    END IF;
  ELSE
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_direction');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'wallet', v_row.balance,
    'bank', v_row.bank,
    'bank_cap', v_row.bank_cap
  );
END;
$function$;