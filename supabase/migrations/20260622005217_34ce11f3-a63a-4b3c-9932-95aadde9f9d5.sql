
-- ============================================================
-- FASE 5 — Cosméticos de perfil + Sistemas automáticos
-- ============================================================

-- ---------- ENUMs ----------
DO $$ BEGIN
  CREATE TYPE public.cosmetic_type AS ENUM ('banner', 'frame', 'sticker', 'effect', 'background_pattern', 'badge_decoration');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.cosmetic_rarity AS ENUM ('common', 'rare', 'epic', 'legendary', 'seasonal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.cosmetic_source AS ENUM ('shop', 'drop', 'gift', 'seasonal_reward', 'admin_grant', 'vip_bonus');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.automation_kind AS ENUM (
    'weekly_ranking_posted',
    'season_ended',
    'season_started',
    'insight_sent',
    'milestone_reached',
    'cosmetic_rotation_generated',
    'economy_autotune',
    'missions_generated',
    'cosmetic_drop_spawned'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- 1. profile_cosmetics (catálogo global) ----------
CREATE TABLE IF NOT EXISTS public.profile_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  type public.cosmetic_type NOT NULL,
  rarity public.cosmetic_rarity NOT NULL DEFAULT 'common',
  price_coins BIGINT NOT NULL DEFAULT 0,
  price_premium INT NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL,
  preview_url TEXT,
  collection TEXT,
  season_id UUID,
  vip_only BOOLEAN NOT NULL DEFAULT FALSE,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_cosmetics_type ON public.profile_cosmetics(type) WHERE active;
CREATE INDEX IF NOT EXISTS idx_profile_cosmetics_rarity ON public.profile_cosmetics(rarity) WHERE active;
CREATE INDEX IF NOT EXISTS idx_profile_cosmetics_collection ON public.profile_cosmetics(collection);
CREATE INDEX IF NOT EXISTS idx_profile_cosmetics_season ON public.profile_cosmetics(season_id);

GRANT SELECT ON public.profile_cosmetics TO anon;
GRANT SELECT ON public.profile_cosmetics TO authenticated;
GRANT ALL ON public.profile_cosmetics TO service_role;

ALTER TABLE public.profile_cosmetics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catálogo de cosméticos é público (somente ativos)"
  ON public.profile_cosmetics FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- ---------- 2. user_cosmetics (inventário) ----------
CREATE TABLE IF NOT EXISTS public.user_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  cosmetic_id UUID NOT NULL REFERENCES public.profile_cosmetics(id) ON DELETE CASCADE,
  source public.cosmetic_source NOT NULL DEFAULT 'shop',
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  gifted_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(user_id, cosmetic_id)
);

CREATE INDEX IF NOT EXISTS idx_user_cosmetics_user ON public.user_cosmetics(user_id);

GRANT SELECT ON public.user_cosmetics TO authenticated;
GRANT ALL ON public.user_cosmetics TO service_role;

ALTER TABLE public.user_cosmetics ENABLE ROW LEVEL SECURITY;

-- leitura: serviço somente (consultas pelo bot/server functions com admin).
CREATE POLICY "Inventário acessado apenas pelo serviço"
  ON public.user_cosmetics FOR SELECT
  TO authenticated
  USING (false);

-- ---------- 3. user_profile_loadout (equipados) ----------
CREATE TABLE IF NOT EXISTS public.user_profile_loadout (
  user_id TEXT PRIMARY KEY,
  banner_id UUID REFERENCES public.profile_cosmetics(id) ON DELETE SET NULL,
  frame_id UUID REFERENCES public.profile_cosmetics(id) ON DELETE SET NULL,
  effect_id UUID REFERENCES public.profile_cosmetics(id) ON DELETE SET NULL,
  background_pattern_id UUID REFERENCES public.profile_cosmetics(id) ON DELETE SET NULL,
  sticker_ids UUID[] NOT NULL DEFAULT '{}',
  accent_color TEXT,
  bio TEXT,
  card_layout TEXT NOT NULL DEFAULT 'classic',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_profile_loadout TO authenticated;
GRANT ALL ON public.user_profile_loadout TO service_role;

ALTER TABLE public.user_profile_loadout ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Loadout acessado apenas pelo serviço"
  ON public.user_profile_loadout FOR SELECT
  TO authenticated
  USING (false);

-- ---------- 4. cosmetic_drops ----------
CREATE TABLE IF NOT EXISTS public.cosmetic_drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cosmetic_id UUID NOT NULL REFERENCES public.profile_cosmetics(id) ON DELETE CASCADE,
  guild_id TEXT,
  channel_id TEXT,
  message_id TEXT,
  spawned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  claimed_by TEXT,
  claimed_at TIMESTAMPTZ,
  max_claims INT NOT NULL DEFAULT 1,
  claim_count INT NOT NULL DEFAULT 0,
  trigger_event TEXT
);

CREATE INDEX IF NOT EXISTS idx_cosmetic_drops_active ON public.cosmetic_drops(expires_at) WHERE claimed_by IS NULL;
CREATE INDEX IF NOT EXISTS idx_cosmetic_drops_guild ON public.cosmetic_drops(guild_id);

GRANT SELECT ON public.cosmetic_drops TO authenticated;
GRANT ALL ON public.cosmetic_drops TO service_role;

ALTER TABLE public.cosmetic_drops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drops acessados apenas pelo serviço"
  ON public.cosmetic_drops FOR SELECT
  TO authenticated
  USING (false);

-- ---------- 5. cosmetic_rotations (destaques diários da loja) ----------
CREATE TABLE IF NOT EXISTS public.cosmetic_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotation_date DATE NOT NULL UNIQUE,
  daily_offers UUID[] NOT NULL DEFAULT '{}',
  rare_picks UUID[] NOT NULL DEFAULT '{}',
  discount_percent INT NOT NULL DEFAULT 20,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cosmetic_rotations_date ON public.cosmetic_rotations(rotation_date DESC);

GRANT SELECT ON public.cosmetic_rotations TO anon;
GRANT SELECT ON public.cosmetic_rotations TO authenticated;
GRANT ALL ON public.cosmetic_rotations TO service_role;

ALTER TABLE public.cosmetic_rotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rotação diária é pública"
  ON public.cosmetic_rotations FOR SELECT
  TO anon, authenticated
  USING (true);

-- ---------- 6. automation_events (log de tudo automático) ----------
CREATE TABLE IF NOT EXISTS public.automation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.automation_kind NOT NULL,
  guild_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_events_kind_date ON public.automation_events(kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_events_guild ON public.automation_events(guild_id, created_at DESC);

GRANT ALL ON public.automation_events TO service_role;

ALTER TABLE public.automation_events ENABLE ROW LEVEL SECURITY;

-- ---------- 7. guild_milestones ----------
CREATE TABLE IF NOT EXISTS public.guild_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL,
  milestone_type TEXT NOT NULL,
  milestone_value BIGINT NOT NULL,
  reached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  announced BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(guild_id, milestone_type, milestone_value)
);

CREATE INDEX IF NOT EXISTS idx_guild_milestones_guild ON public.guild_milestones(guild_id, reached_at DESC);

GRANT ALL ON public.guild_milestones TO service_role;

ALTER TABLE public.guild_milestones ENABLE ROW LEVEL SECURITY;

-- ---------- 8. weekly_rankings ----------
CREATE TABLE IF NOT EXISTS public.weekly_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL,
  week_start DATE NOT NULL,
  category TEXT NOT NULL,
  rankings JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(guild_id, week_start, category)
);

CREATE INDEX IF NOT EXISTS idx_weekly_rankings_guild_week ON public.weekly_rankings(guild_id, week_start DESC);

GRANT ALL ON public.weekly_rankings TO service_role;

ALTER TABLE public.weekly_rankings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Triggers para updated_at
-- ============================================================
CREATE TRIGGER trg_profile_cosmetics_updated
  BEFORE UPDATE ON public.profile_cosmetics
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_user_profile_loadout_updated
  BEFORE UPDATE ON public.user_profile_loadout
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- RPC: cosmetic_purchase — compra atômica
-- ============================================================
CREATE OR REPLACE FUNCTION public.cosmetic_purchase(
  _user_id TEXT,
  _guild_id TEXT,
  _cosmetic_id UUID,
  _use_discount BOOLEAN DEFAULT FALSE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cosmetic RECORD;
  v_price BIGINT;
  v_debit JSONB;
  v_already_owned BOOLEAN;
  v_rotation RECORD;
  v_discount INT := 0;
BEGIN
  SELECT * INTO v_cosmetic FROM public.profile_cosmetics WHERE id = _cosmetic_id AND active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF v_cosmetic.available_from IS NOT NULL AND v_cosmetic.available_from > now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_available_yet');
  END IF;
  IF v_cosmetic.available_until IS NOT NULL AND v_cosmetic.available_until < now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.user_cosmetics WHERE user_id = _user_id AND cosmetic_id = _cosmetic_id) INTO v_already_owned;
  IF v_already_owned THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_owned');
  END IF;

  v_price := v_cosmetic.price_coins;

  IF _use_discount THEN
    SELECT * INTO v_rotation FROM public.cosmetic_rotations WHERE rotation_date = CURRENT_DATE;
    IF FOUND AND _cosmetic_id = ANY(v_rotation.daily_offers) THEN
      v_discount := v_rotation.discount_percent;
      v_price := (v_price * (100 - v_discount)) / 100;
    END IF;
  END IF;

  IF v_price <= 0 THEN
    -- item gratuito (drop/seasonal) — apenas insere
    INSERT INTO public.user_cosmetics (user_id, cosmetic_id, source, metadata)
    VALUES (_user_id, _cosmetic_id, 'shop', jsonb_build_object('price_paid', 0));
    RETURN jsonb_build_object('ok', true, 'price_paid', 0, 'discount', 0);
  END IF;

  v_debit := public.economy_debit_wallet(_guild_id, _user_id, v_price);
  IF NOT (v_debit->>'ok')::boolean THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_funds', 'needed', v_price);
  END IF;

  INSERT INTO public.user_cosmetics (user_id, cosmetic_id, source, metadata)
  VALUES (_user_id, _cosmetic_id, 'shop',
    jsonb_build_object('price_paid', v_price, 'discount', v_discount, 'guild_id', _guild_id));

  RETURN jsonb_build_object(
    'ok', true,
    'price_paid', v_price,
    'discount', v_discount,
    'new_balance', (v_debit->>'balance')::bigint
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cosmetic_purchase(TEXT, TEXT, UUID, BOOLEAN) TO service_role;

-- ============================================================
-- RPC: rotate_daily_cosmetics — gera a rotação do dia
-- ============================================================
CREATE OR REPLACE FUNCTION public.rotate_daily_cosmetics(_force BOOLEAN DEFAULT FALSE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_existing UUID;
  v_offers UUID[];
  v_rares UUID[];
BEGIN
  SELECT id INTO v_existing FROM public.cosmetic_rotations WHERE rotation_date = v_today;
  IF v_existing IS NOT NULL AND NOT _force THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'rotation_id', v_existing);
  END IF;

  -- 6 ofertas: pick aleatório de commons/rares ativos com preço > 0
  SELECT ARRAY(
    SELECT id FROM public.profile_cosmetics
    WHERE active = true
      AND price_coins > 0
      AND rarity IN ('common', 'rare')
      AND (available_until IS NULL OR available_until > now())
    ORDER BY random()
    LIMIT 6
  ) INTO v_offers;

  -- 2 raros: pick de epic/legendary
  SELECT ARRAY(
    SELECT id FROM public.profile_cosmetics
    WHERE active = true
      AND price_coins > 0
      AND rarity IN ('epic', 'legendary')
      AND (available_until IS NULL OR available_until > now())
    ORDER BY random()
    LIMIT 2
  ) INTO v_rares;

  IF v_existing IS NOT NULL THEN
    UPDATE public.cosmetic_rotations
       SET daily_offers = v_offers, rare_picks = v_rares
     WHERE id = v_existing
     RETURNING id INTO v_existing;
  ELSE
    INSERT INTO public.cosmetic_rotations (rotation_date, daily_offers, rare_picks)
    VALUES (v_today, v_offers, v_rares)
    RETURNING id INTO v_existing;
  END IF;

  INSERT INTO public.automation_events (kind, payload)
  VALUES ('cosmetic_rotation_generated',
          jsonb_build_object('rotation_id', v_existing, 'offers_count', array_length(v_offers, 1), 'rare_count', array_length(v_rares, 1)));

  RETURN jsonb_build_object('ok', true, 'rotation_id', v_existing, 'offers', v_offers, 'rares', v_rares);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rotate_daily_cosmetics(BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.rotate_daily_cosmetics(BOOLEAN) TO anon;

-- ============================================================
-- RPC: snapshot_weekly_ranking
-- ============================================================
CREATE OR REPLACE FUNCTION public.snapshot_weekly_ranking(_guild_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::date;
  v_xp JSONB;
  v_coins JSONB;
  v_rep JSONB;
BEGIN
  -- top XP
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY (t.xp)::bigint DESC), '[]'::jsonb) INTO v_xp
  FROM (
    SELECT user_id, total_xp AS xp
    FROM public.level_users
    WHERE guild_id = _guild_id
    ORDER BY total_xp DESC NULLS LAST
    LIMIT 5
  ) t;

  -- top moedas
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY (t.balance)::bigint DESC), '[]'::jsonb) INTO v_coins
  FROM (
    SELECT user_id, balance
    FROM public.user_economy
    WHERE guild_id = _guild_id
    ORDER BY balance DESC NULLS LAST
    LIMIT 5
  ) t;

  -- top reputação (últimos 7 dias)
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY (t.rep)::bigint DESC), '[]'::jsonb) INTO v_rep
  FROM (
    SELECT to_user_id AS user_id, COUNT(*)::bigint AS rep
    FROM public.reputation_logs
    WHERE guild_id = _guild_id
      AND created_at >= now() - interval '7 days'
    GROUP BY to_user_id
    ORDER BY rep DESC
    LIMIT 5
  ) t;

  INSERT INTO public.weekly_rankings (guild_id, week_start, category, rankings)
  VALUES
    (_guild_id, v_week_start, 'xp', v_xp),
    (_guild_id, v_week_start, 'coins', v_coins),
    (_guild_id, v_week_start, 'reputation', v_rep)
  ON CONFLICT (guild_id, week_start, category)
  DO UPDATE SET rankings = EXCLUDED.rankings;

  RETURN jsonb_build_object(
    'ok', true,
    'guild_id', _guild_id,
    'week_start', v_week_start,
    'xp', v_xp,
    'coins', v_coins,
    'reputation', v_rep
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.snapshot_weekly_ranking(TEXT) TO service_role;

-- ============================================================
-- View pública para a vitrine da loja (apenas itens compráveis)
-- ============================================================
CREATE OR REPLACE VIEW public.cosmetic_shop_view AS
SELECT
  pc.id,
  pc.slug,
  pc.name,
  pc.description,
  pc.type,
  pc.rarity,
  pc.price_coins,
  pc.price_premium,
  pc.image_url,
  pc.preview_url,
  pc.collection,
  pc.vip_only,
  pc.available_until,
  pc.sort_order,
  pc.metadata,
  (CURRENT_DATE = ANY(
    SELECT rotation_date FROM public.cosmetic_rotations WHERE pc.id = ANY(daily_offers)
  )) AS is_on_offer,
  (CURRENT_DATE = ANY(
    SELECT rotation_date FROM public.cosmetic_rotations WHERE pc.id = ANY(rare_picks)
  )) AS is_rare_pick
FROM public.profile_cosmetics pc
WHERE pc.active = true
  AND (pc.available_from IS NULL OR pc.available_from <= now())
  AND (pc.available_until IS NULL OR pc.available_until > now());

GRANT SELECT ON public.cosmetic_shop_view TO anon, authenticated;
