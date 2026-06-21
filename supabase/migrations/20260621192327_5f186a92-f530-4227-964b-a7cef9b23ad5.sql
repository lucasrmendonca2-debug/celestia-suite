
-- =========================================================
-- FASE 1 — Tabelas que faltam + extensões em existentes
-- =========================================================

-- ----------------------- user_economy: novas colunas
ALTER TABLE public.user_economy
  ADD COLUMN IF NOT EXISTS bank_cap      bigint NOT NULL DEFAULT 100000,
  ADD COLUMN IF NOT EXISTS last_crime_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_rob_at   timestamptz;

-- ----------------------- guild_configs: campos usados pelo bot
ALTER TABLE public.guild_configs
  ADD COLUMN IF NOT EXISTS economy_currency_name  text DEFAULT 'Zen',
  ADD COLUMN IF NOT EXISTS economy_currency_emoji text DEFAULT '💜',
  ADD COLUMN IF NOT EXISTS vip_role_id            text,
  ADD COLUMN IF NOT EXISTS mod_log_channel_id     text,
  ADD COLUMN IF NOT EXISTS message_log_channel_id text,
  ADD COLUMN IF NOT EXISTS member_log_channel_id  text,
  ADD COLUMN IF NOT EXISTS server_log_channel_id  text;

-- =========================================================
-- inventory_items
-- =========================================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id     text NOT NULL,
  user_id      text NOT NULL,
  name         text NOT NULL,
  quantity     integer NOT NULL DEFAULT 1,
  shop_item_id uuid REFERENCES public.shop_items(id) ON DELETE SET NULL,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inventory_items_user ON public.inventory_items(guild_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_items_unique ON public.inventory_items(guild_id, user_id, name);

GRANT SELECT ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own inventory" ON public.inventory_items
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

CREATE TRIGGER trg_inventory_items_touch
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- marriages
-- =========================================================
CREATE TABLE IF NOT EXISTS public.marriages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id    text NOT NULL,
  user_a_id   text NOT NULL,
  user_b_id   text NOT NULL,
  status      text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING','ACTIVE','BROKEN','REJECTED')),
  since       timestamptz,
  broken_at   timestamptz,
  proposed_by text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marriages_distinct_users CHECK (user_a_id <> user_b_id)
);
CREATE INDEX IF NOT EXISTS idx_marriages_user_a ON public.marriages(guild_id, user_a_id, status);
CREATE INDEX IF NOT EXISTS idx_marriages_user_b ON public.marriages(guild_id, user_b_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_marriages_active_pair
  ON public.marriages(guild_id, LEAST(user_a_id, user_b_id), GREATEST(user_a_id, user_b_id))
  WHERE status IN ('ACTIVE','PENDING');

GRANT SELECT ON public.marriages TO authenticated;
GRANT ALL ON public.marriages TO service_role;

ALTER TABLE public.marriages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read marriages they are in" ON public.marriages
  FOR SELECT TO authenticated
  USING (user_a_id = auth.uid()::text OR user_b_id = auth.uid()::text);

CREATE TRIGGER trg_marriages_touch
  BEFORE UPDATE ON public.marriages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- giveaways
-- =========================================================
CREATE TABLE IF NOT EXISTS public.giveaways (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id      text NOT NULL,
  channel_id    text NOT NULL,
  message_id    text,
  host_id       text NOT NULL,
  prize         text NOT NULL,
  winners_count integer NOT NULL DEFAULT 1,
  ends_at       timestamptz NOT NULL,
  ended         boolean NOT NULL DEFAULT false,
  ended_at      timestamptz,
  requirements  jsonb NOT NULL DEFAULT '{}'::jsonb,
  participants  jsonb NOT NULL DEFAULT '[]'::jsonb,
  winners       jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_giveaways_active ON public.giveaways(guild_id, ended, ends_at);

GRANT SELECT ON public.giveaways TO authenticated;
GRANT ALL ON public.giveaways TO service_role;

ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "any authenticated reads giveaways" ON public.giveaways
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_giveaways_touch
  BEFORE UPDATE ON public.giveaways
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- reminders
-- =========================================================
CREATE TABLE IF NOT EXISTS public.reminders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text NOT NULL,
  guild_id   text,
  channel_id text,
  message    text NOT NULL,
  fire_at    timestamptz NOT NULL,
  fired      boolean NOT NULL DEFAULT false,
  fired_at   timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reminders_pending ON public.reminders(fired, fire_at);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON public.reminders(user_id);

GRANT SELECT ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own reminders" ON public.reminders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

CREATE TRIGGER trg_reminders_touch
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- announcements
-- =========================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id     text NOT NULL,
  channel_id   text NOT NULL,
  author_id    text NOT NULL,
  content      text,
  embed        jsonb,
  scheduled_at timestamptz,
  sent_at      timestamptz,
  message_id   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_announcements_guild ON public.announcements(guild_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_pending ON public.announcements(scheduled_at) WHERE sent_at IS NULL;

GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
-- Sem policy para authenticated: leitura via backend (service_role) apenas.

CREATE TRIGGER trg_announcements_touch
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- daily_tokens
-- =========================================================
CREATE TABLE IF NOT EXISTS public.daily_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text NOT NULL,
  guild_id   text,
  token      text NOT NULL UNIQUE,
  used       boolean NOT NULL DEFAULT false,
  used_at    timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_daily_tokens_user ON public.daily_tokens(user_id, used);

GRANT SELECT ON public.daily_tokens TO authenticated;
GRANT ALL ON public.daily_tokens TO service_role;

ALTER TABLE public.daily_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own daily tokens" ON public.daily_tokens
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

-- =========================================================
-- cooldowns
-- =========================================================
CREATE TABLE IF NOT EXISTS public.cooldowns (
  guild_id   text NOT NULL,
  user_id    text NOT NULL,
  command    text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, user_id, command)
);
CREATE INDEX IF NOT EXISTS idx_cooldowns_expires ON public.cooldowns(expires_at);

GRANT SELECT ON public.cooldowns TO authenticated;
GRANT ALL ON public.cooldowns TO service_role;

ALTER TABLE public.cooldowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own cooldowns" ON public.cooldowns
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

-- =========================================================
-- automod_incidents
-- =========================================================
CREATE TABLE IF NOT EXISTS public.automod_incidents (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id   text NOT NULL,
  user_id    text NOT NULL,
  channel_id text,
  type       text NOT NULL,
  severity   text NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
  reason     text,
  message_id text,
  detail     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_automod_incidents_guild ON public.automod_incidents(guild_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automod_incidents_user ON public.automod_incidents(guild_id, user_id, created_at DESC);

GRANT ALL ON public.automod_incidents TO service_role;

ALTER TABLE public.automod_incidents ENABLE ROW LEVEL SECURITY;
-- Sem policy para authenticated: leitura via backend (service_role) apenas.
