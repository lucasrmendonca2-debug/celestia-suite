
CREATE OR REPLACE FUNCTION public.redeem_guild_premium_code(
  _code TEXT,
  _guild_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code RECORD;
  v_plan RECORD;
  v_duration_days INT;
  v_expires_at TIMESTAMPTZ;
  v_sub_id UUID;
  v_norm TEXT := upper(btrim(_code));
BEGIN
  -- Lock da linha do código para evitar corrida
  SELECT * INTO v_code
  FROM public.premium_activation_codes
  WHERE code = v_norm
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF NOT v_code.active THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'inactive');
  END IF;
  IF v_code.expires_at IS NOT NULL AND v_code.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;
  IF v_code.used_count >= v_code.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'exhausted');
  END IF;
  IF v_code.type <> 'GUILD_PREMIUM' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'plan_mismatch');
  END IF;

  SELECT * INTO v_plan FROM public.premium_plans WHERE id = v_code.plan_id;
  IF NOT FOUND OR NOT v_plan.active THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'inactive');
  END IF;

  v_duration_days := COALESCE(v_code.duration_days, v_plan.duration_days);
  v_expires_at := CASE WHEN v_duration_days IS NOT NULL
                       THEN now() + make_interval(days => v_duration_days)
                       ELSE NULL END;

  -- Cancela ativas duplicadas da mesma guild
  UPDATE public.premium_subscriptions
     SET status = 'CANCELLED', cancelled_at = now()
   WHERE type = 'GUILD_PREMIUM'
     AND guild_id = _guild_id
     AND status = 'ACTIVE';

  INSERT INTO public.premium_subscriptions
    (type, plan_id, guild_id, status, starts_at, expires_at, source, notes)
  VALUES
    ('GUILD_PREMIUM', v_plan.id, _guild_id, 'ACTIVE', now(), v_expires_at,
     'code', 'code:' || v_code.code)
  RETURNING id INTO v_sub_id;

  UPDATE public.premium_activation_codes
     SET used_count = used_count + 1
   WHERE id = v_code.id;

  INSERT INTO public.premium_activations (code_id, guild_id, subscription_id)
  VALUES (v_code.id, _guild_id, v_sub_id);

  INSERT INTO public.premium_audit_log (action, target_guild_id, plan_id, details)
  VALUES ('code.redeem.dashboard', _guild_id, v_plan.id,
          jsonb_build_object('codeId', v_code.id));

  RETURN jsonb_build_object(
    'ok', true,
    'subscription_id', v_sub_id,
    'plan_id', v_plan.id,
    'expires_at', v_expires_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_guild_premium_code(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_guild_premium_code(TEXT, TEXT) TO service_role;
