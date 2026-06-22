
-- ============================================================================
-- INTELLIGENCE LAYER: dynamic missions, insights, milestones, economy tuning
-- ============================================================================

-- 1) USER MISSION PROGRESS PROFILE (dificuldade adaptativa)
CREATE TABLE IF NOT EXISTS public.user_mission_profile (
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  completed_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  difficulty_score NUMERIC NOT NULL DEFAULT 1.0,
  last_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, guild_id)
);
GRANT SELECT ON public.user_mission_profile TO authenticated;
GRANT ALL ON public.user_mission_profile TO service_role;
ALTER TABLE public.user_mission_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own mission profile"
  ON public.user_mission_profile FOR SELECT
  TO authenticated
  USING (true);

-- 2) GUILD INSIGHTS (resultados do Insight Engine)
CREATE TABLE IF NOT EXISTS public.guild_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivered BOOLEAN NOT NULL DEFAULT false,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_guild_insights_guild_undelivered
  ON public.guild_insights (guild_id, delivered, created_at DESC);
GRANT SELECT ON public.guild_insights TO authenticated;
GRANT ALL ON public.guild_insights TO service_role;
ALTER TABLE public.guild_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service manages insights"
  ON public.guild_insights FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 3) ECONOMY TUNING STATE (auto-tuning de economia)
CREATE TABLE IF NOT EXISTS public.economy_tuning_state (
  guild_id TEXT PRIMARY KEY,
  shop_price_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  daily_reward_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  state TEXT NOT NULL DEFAULT 'stable',
  avg_balance_last_week BIGINT NOT NULL DEFAULT 0,
  avg_balance_current BIGINT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  last_tuned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.economy_tuning_state TO authenticated;
GRANT ALL ON public.economy_tuning_state TO service_role;
ALTER TABLE public.economy_tuning_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read tuning state"
  ON public.economy_tuning_state FOR SELECT
  TO authenticated USING (true);

CREATE TRIGGER trg_economy_tuning_state_touch
  BEFORE UPDATE ON public.economy_tuning_state
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_user_mission_profile_touch
  BEFORE UPDATE ON public.user_mission_profile
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================================
-- RPC: generate_daily_missions(guild_id)
--   Gera 3 missões diárias por servidor baseadas em comportamento real.
--   Atualiza linhas com period='daily' e is_active=true em economy_missions.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_daily_missions(_guild_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_top_command TEXT;
  v_msg_count BIGINT;
  v_pay_count BIGINT;
  v_existing INT;
  v_missions JSONB := '[]'::jsonb;
BEGIN
  -- Comportamento real: número de transações dos últimos 7 dias
  SELECT COUNT(*) INTO v_msg_count
  FROM public.economy_transactions
  WHERE guild_id = _guild_id
    AND created_at >= now() - interval '7 days';

  SELECT COUNT(*) INTO v_pay_count
  FROM public.economy_transactions
  WHERE guild_id = _guild_id
    AND kind = 'transfer'
    AND created_at >= now() - interval '7 days';

  -- Desativa missões diárias anteriores
  UPDATE public.economy_missions
     SET is_active = false
   WHERE guild_id = _guild_id
     AND period = 'daily'
     AND is_active = true;

  -- Missão 1: Mensagens
  INSERT INTO public.economy_missions
    (guild_id, period, code, title, description, target, reward_coins, reward_xp, is_active, expires_at)
  VALUES
    (_guild_id, 'daily', 'daily_msgs_' || extract(epoch from now())::bigint,
     'Conversador do dia',
     'Envie ' || GREATEST(10, LEAST(50, (v_msg_count / 30)::int)) || ' mensagens hoje',
     GREATEST(10, LEAST(50, (v_msg_count / 30)::int)),
     150, 80, true, now() + interval '24 hours');

  -- Missão 2: Pagar/Receber (se há economia social)
  INSERT INTO public.economy_missions
    (guild_id, period, code, title, description, target, reward_coins, reward_xp, is_active, expires_at)
  VALUES
    (_guild_id, 'daily', 'daily_social_' || extract(epoch from now())::bigint,
     CASE WHEN v_pay_count > 5 THEN 'Mão aberta' ELSE 'Faça amigos' END,
     CASE WHEN v_pay_count > 5
          THEN 'Pague 100 moedas a outro membro'
          ELSE 'Use /diario hoje' END,
     1, 100, 50, true, now() + interval '24 hours');

  -- Missão 3: Diária
  INSERT INTO public.economy_missions
    (guild_id, period, code, title, description, target, reward_coins, reward_xp, is_active, expires_at)
  VALUES
    (_guild_id, 'daily', 'daily_login_' || extract(epoch from now())::bigint,
     'Visita diária',
     'Resgate sua recompensa diária',
     1, 200, 100, true, now() + interval '24 hours');

  RETURN jsonb_build_object('ok', true, 'guild_id', _guild_id, 'msg_count', v_msg_count, 'pay_count', v_pay_count);
END;
$$;

-- ============================================================================
-- RPC: generate_guild_insights(guild_id)
--   Detecta padrões e cria registros em guild_insights.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_guild_insights(_guild_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msgs_this_week BIGINT;
  v_msgs_last_week BIGINT;
  v_growth NUMERIC;
  v_warns_week INT;
  v_pay_growth NUMERIC;
  v_pay_now BIGINT;
  v_pay_prev BIGINT;
  v_vip_buyers INT;
  v_created INT := 0;
BEGIN
  -- Atividade semana atual vs anterior
  SELECT COUNT(*) INTO v_msgs_this_week
  FROM public.economy_transactions
  WHERE guild_id = _guild_id AND created_at >= now() - interval '7 days';

  SELECT COUNT(*) INTO v_msgs_last_week
  FROM public.economy_transactions
  WHERE guild_id = _guild_id
    AND created_at >= now() - interval '14 days'
    AND created_at <  now() - interval '7 days';

  IF v_msgs_last_week > 0 THEN
    v_growth := ((v_msgs_this_week::numeric - v_msgs_last_week) / v_msgs_last_week) * 100;
    IF v_growth >= 30 THEN
      INSERT INTO public.guild_insights (guild_id, kind, severity, title, description, metrics)
      VALUES (_guild_id, 'activity_spike', 'positive',
              '📈 Atividade subiu ' || round(v_growth) || '% essa semana',
              'Aproveite o momento — considere lançar um evento.',
              jsonb_build_object('this_week', v_msgs_this_week, 'last_week', v_msgs_last_week, 'growth_pct', v_growth));
      v_created := v_created + 1;
    ELSIF v_growth <= -30 THEN
      INSERT INTO public.guild_insights (guild_id, kind, severity, title, description, metrics)
      VALUES (_guild_id, 'activity_drop', 'warning',
              '📉 Atividade caiu ' || round(abs(v_growth)) || '% essa semana',
              'Considere um giveaway ou evento para reengajar.',
              jsonb_build_object('this_week', v_msgs_this_week, 'last_week', v_msgs_last_week, 'growth_pct', v_growth));
      v_created := v_created + 1;
    END IF;
  END IF;

  -- Moderação: warns esta semana
  SELECT COUNT(*) INTO v_warns_week
  FROM public.mod_cases
  WHERE guild_id = _guild_id
    AND action = 'warn'
    AND created_at >= now() - interval '7 days';

  IF v_warns_week >= 10 THEN
    INSERT INTO public.guild_insights (guild_id, kind, severity, title, description, metrics)
    VALUES (_guild_id, 'mod_volume_high', 'warning',
            '⚠️ ' || v_warns_week || ' advertências essa semana',
            'Volume alto de moderação — revise tom e regras se necessário.',
            jsonb_build_object('warns', v_warns_week));
    v_created := v_created + 1;
  END IF;

  -- Economia: transferências
  SELECT COUNT(*) INTO v_pay_now
  FROM public.economy_transactions
  WHERE guild_id = _guild_id AND kind = 'transfer' AND created_at >= now() - interval '7 days';
  SELECT COUNT(*) INTO v_pay_prev
  FROM public.economy_transactions
  WHERE guild_id = _guild_id AND kind = 'transfer'
    AND created_at >= now() - interval '14 days' AND created_at < now() - interval '7 days';

  IF v_pay_prev > 0 THEN
    v_pay_growth := ((v_pay_now::numeric - v_pay_prev) / v_pay_prev) * 100;
    IF v_pay_growth >= 100 THEN
      INSERT INTO public.guild_insights (guild_id, kind, severity, title, description, metrics)
      VALUES (_guild_id, 'economy_heating', 'positive',
              '🔥 Transferências cresceram ' || round(v_pay_growth) || '%',
              'Economia esquentando — sinal saudável de circulação.',
              jsonb_build_object('now', v_pay_now, 'prev', v_pay_prev));
      v_created := v_created + 1;
    END IF;
  END IF;

  -- Premium: novos VIPs
  SELECT COUNT(*) INTO v_vip_buyers
  FROM public.premium_subscriptions
  WHERE guild_id = _guild_id
    AND status = 'ACTIVE'
    AND starts_at >= now() - interval '30 days';

  IF v_vip_buyers >= 3 THEN
    INSERT INTO public.guild_insights (guild_id, kind, severity, title, description, metrics)
    VALUES (_guild_id, 'premium_growth', 'positive',
            '💎 ' || v_vip_buyers || ' novas assinaturas Premium este mês',
            'Sua comunidade está investindo no servidor.',
            jsonb_build_object('count', v_vip_buyers));
    v_created := v_created + 1;
  END IF;

  RETURN jsonb_build_object('ok', true, 'guild_id', _guild_id, 'created', v_created);
END;
$$;

-- ============================================================================
-- RPC: detect_guild_milestones(guild_id, member_count)
--   Detecta marcos (100/500/1k/5k membros, aniversário) e grava em guild_milestones.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.detect_guild_milestones(_guild_id TEXT, _member_count INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_milestone INT;
  v_created INT := 0;
  v_thresholds INT[] := ARRAY[100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
  v_first_seen TIMESTAMPTZ;
BEGIN
  -- Marcos de membros
  FOREACH v_milestone IN ARRAY v_thresholds LOOP
    IF _member_count >= v_milestone THEN
      INSERT INTO public.guild_milestones (guild_id, kind, value, achieved_at, metadata)
      VALUES (_guild_id, 'member_count', v_milestone, now(),
              jsonb_build_object('current_members', _member_count))
      ON CONFLICT DO NOTHING;
      IF FOUND THEN v_created := v_created + 1; END IF;
    END IF;
  END LOOP;

  -- Aniversário do servidor (primeira presença)
  SELECT MIN(created_at) INTO v_first_seen
  FROM public.bot_guild_presence
  WHERE guild_id = _guild_id;

  IF v_first_seen IS NOT NULL
     AND extract(month from v_first_seen) = extract(month from now())
     AND extract(day from v_first_seen) = extract(day from now())
     AND extract(year from v_first_seen) < extract(year from now()) THEN
    INSERT INTO public.guild_milestones (guild_id, kind, value, achieved_at, metadata)
    VALUES (_guild_id, 'anniversary',
            (extract(year from now()) - extract(year from v_first_seen))::int,
            now(),
            jsonb_build_object('since', v_first_seen))
    ON CONFLICT DO NOTHING;
    IF FOUND THEN v_created := v_created + 1; END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'created', v_created);
END;
$$;

-- ============================================================================
-- RPC: tune_guild_economy(guild_id)
--   Auto-tuning: detecta inflação/deflação e ajusta multipliers.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.tune_guild_economy(_guild_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg_now BIGINT;
  v_avg_prev BIGINT;
  v_state TEXT := 'stable';
  v_shop_mult NUMERIC := 1.0;
  v_daily_mult NUMERIC := 1.0;
  v_expires TIMESTAMPTZ := NULL;
  v_ratio NUMERIC;
BEGIN
  -- Saldo médio atual
  SELECT COALESCE(avg(balance)::bigint, 0) INTO v_avg_now
  FROM public.user_economy
  WHERE guild_id = _guild_id AND balance > 0;

  -- Saldo médio "anterior" (lemos do state se existir)
  SELECT avg_balance_current INTO v_avg_prev
  FROM public.economy_tuning_state
  WHERE guild_id = _guild_id;
  v_avg_prev := COALESCE(v_avg_prev, v_avg_now);

  IF v_avg_prev > 0 THEN
    v_ratio := v_avg_now::numeric / v_avg_prev;
    IF v_ratio >= 2.0 THEN
      v_state := 'inflation';
      v_shop_mult := 1.10;
      v_daily_mult := 1.0;
      v_expires := now() + interval '3 days';
    ELSIF v_ratio <= 0.5 THEN
      v_state := 'deflation';
      v_shop_mult := 1.0;
      v_daily_mult := 1.20;
      v_expires := now() + interval '3 days';
    END IF;
  END IF;

  INSERT INTO public.economy_tuning_state
    (guild_id, shop_price_multiplier, daily_reward_multiplier, state,
     avg_balance_last_week, avg_balance_current, expires_at, last_tuned_at)
  VALUES (_guild_id, v_shop_mult, v_daily_mult, v_state, v_avg_prev, v_avg_now, v_expires, now())
  ON CONFLICT (guild_id) DO UPDATE
     SET shop_price_multiplier = EXCLUDED.shop_price_multiplier,
         daily_reward_multiplier = EXCLUDED.daily_reward_multiplier,
         state = EXCLUDED.state,
         avg_balance_last_week = public.economy_tuning_state.avg_balance_current,
         avg_balance_current = EXCLUDED.avg_balance_current,
         expires_at = EXCLUDED.expires_at,
         last_tuned_at = now();

  RETURN jsonb_build_object('ok', true, 'state', v_state,
    'shop_mult', v_shop_mult, 'daily_mult', v_daily_mult,
    'avg_now', v_avg_now, 'avg_prev', v_avg_prev);
END;
$$;
