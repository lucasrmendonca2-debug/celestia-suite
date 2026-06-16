
-- 1) Renomear legados (preserva dados antigos sem interferir)
ALTER TABLE IF EXISTS public.leveling_config RENAME TO leveling_config_legacy;
ALTER TABLE IF EXISTS public.user_levels RENAME TO user_levels_legacy;
ALTER TABLE IF EXISTS public.level_rewards RENAME TO level_rewards_legacy;

-- 2) social_config
CREATE TABLE public.social_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  level_enabled BOOLEAN NOT NULL DEFAULT true,
  profile_enabled BOOLEAN NOT NULL DEFAULT true,
  reputation_enabled BOOLEAN NOT NULL DEFAULT true,
  achievements_enabled BOOLEAN NOT NULL DEFAULT true,
  log_channel_id TEXT,
  ignored_channel_ids TEXT[] NOT NULL DEFAULT '{}',
  ignored_role_ids TEXT[] NOT NULL DEFAULT '{}',
  embed_color TEXT NOT NULL DEFAULT '#5865F2',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_config TO authenticated;
GRANT ALL ON public.social_config TO service_role;
ALTER TABLE public.social_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_config service_role" ON public.social_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3) level_config
CREATE TABLE public.level_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  min_xp_per_message INTEGER NOT NULL DEFAULT 15,
  max_xp_per_message INTEGER NOT NULL DEFAULT 25,
  cooldown_seconds INTEGER NOT NULL DEFAULT 60,
  global_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  vip_multiplier NUMERIC(5,2) NOT NULL DEFAULT 2.0,
  level_up_channel_id TEXT,
  level_up_message TEXT NOT NULL DEFAULT 'Boa! {user} avançou para o nível {level}. Continue participando para desbloquear novas recompensas.',
  send_level_up_message BOOLEAN NOT NULL DEFAULT true,
  level_up_message_mode TEXT NOT NULL DEFAULT 'current_channel' CHECK (level_up_message_mode IN ('current_channel','fixed_channel','dm','disabled')),
  delete_level_up_after_seconds INTEGER NOT NULL DEFAULT 0,
  min_message_length INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.level_config TO authenticated;
GRANT ALL ON public.level_config TO service_role;
ALTER TABLE public.level_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "level_config service_role" ON public.level_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4) level_users
CREATE TABLE public.level_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 0,
  total_xp BIGINT NOT NULL DEFAULT 0,
  messages_count INTEGER NOT NULL DEFAULT 0,
  last_xp_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, user_id)
);
CREATE INDEX idx_level_users_guild_total_xp ON public.level_users (guild_id, total_xp DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.level_users TO authenticated;
GRANT ALL ON public.level_users TO service_role;
ALTER TABLE public.level_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "level_users service_role" ON public.level_users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5) level_rewards
CREATE TABLE public.level_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL,
  level INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('role','coins','badge','title')),
  reward_value TEXT NOT NULL,
  remove_previous_roles BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_level_rewards_guild_level ON public.level_rewards (guild_id, level);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.level_rewards TO authenticated;
GRANT ALL ON public.level_rewards TO service_role;
ALTER TABLE public.level_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "level_rewards service_role" ON public.level_rewards FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6) social_profiles
CREATE TABLE public.social_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#5865F2',
  banner_url TEXT,
  reputation INTEGER NOT NULL DEFAULT 0,
  profile_views INTEGER NOT NULL DEFAULT 0,
  selected_badges TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_profiles TO authenticated;
GRANT ALL ON public.social_profiles TO service_role;
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_profiles service_role" ON public.social_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7) reputation_logs
CREATE TABLE public.reputation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reputation_logs_guild_from ON public.reputation_logs (guild_id, from_user_id, created_at DESC);
CREATE INDEX idx_reputation_logs_guild_to ON public.reputation_logs (guild_id, to_user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reputation_logs TO authenticated;
GRANT ALL ON public.reputation_logs TO service_role;
ALTER TABLE public.reputation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reputation_logs service_role" ON public.reputation_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8) level_logs
CREATE TABLE public.level_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  amount INTEGER,
  level INTEGER,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_level_logs_guild_user ON public.level_logs (guild_id, user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.level_logs TO authenticated;
GRANT ALL ON public.level_logs TO service_role;
ALTER TABLE public.level_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "level_logs service_role" ON public.level_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Triggers updated_at (reusa public.touch_updated_at já existente)
CREATE TRIGGER trg_social_config_updated_at BEFORE UPDATE ON public.social_config FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_level_config_updated_at BEFORE UPDATE ON public.level_config FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_level_users_updated_at BEFORE UPDATE ON public.level_users FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_level_rewards_updated_at BEFORE UPDATE ON public.level_rewards FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_social_profiles_updated_at BEFORE UPDATE ON public.social_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
