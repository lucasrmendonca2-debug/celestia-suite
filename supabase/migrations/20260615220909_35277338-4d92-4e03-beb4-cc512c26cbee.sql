
-- =========================================
-- LOGS
-- =========================================
CREATE TABLE public.guild_logs_config (
  guild_id text PRIMARY KEY,
  log_channel_id text,
  member_join boolean NOT NULL DEFAULT true,
  member_leave boolean NOT NULL DEFAULT true,
  member_ban boolean NOT NULL DEFAULT true,
  member_unban boolean NOT NULL DEFAULT true,
  member_kick boolean NOT NULL DEFAULT true,
  member_role_update boolean NOT NULL DEFAULT true,
  member_nickname_update boolean NOT NULL DEFAULT false,
  message_delete boolean NOT NULL DEFAULT true,
  message_edit boolean NOT NULL DEFAULT true,
  message_bulk_delete boolean NOT NULL DEFAULT true,
  channel_create boolean NOT NULL DEFAULT false,
  channel_delete boolean NOT NULL DEFAULT false,
  channel_update boolean NOT NULL DEFAULT false,
  role_create boolean NOT NULL DEFAULT false,
  role_delete boolean NOT NULL DEFAULT false,
  role_update boolean NOT NULL DEFAULT false,
  voice_state_update boolean NOT NULL DEFAULT false,
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.guild_logs_config TO anon, authenticated;
GRANT ALL ON public.guild_logs_config TO service_role;
ALTER TABLE public.guild_logs_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read logs config" ON public.guild_logs_config FOR SELECT USING (true);
CREATE TRIGGER trg_logs_updated BEFORE UPDATE ON public.guild_logs_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================
-- AUTOROLE
-- =========================================
CREATE TABLE public.guild_autoroles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  role_id text NOT NULL,
  target text NOT NULL DEFAULT 'member', -- 'member' | 'bot'
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guild_id, role_id, target)
);
CREATE INDEX idx_autoroles_guild ON public.guild_autoroles (guild_id);
GRANT SELECT ON public.guild_autoroles TO anon, authenticated;
GRANT ALL ON public.guild_autoroles TO service_role;
ALTER TABLE public.guild_autoroles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read autoroles" ON public.guild_autoroles FOR SELECT USING (true);

-- =========================================
-- REACTION ROLES
-- =========================================
CREATE TABLE public.reaction_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  channel_id text NOT NULL,
  message_id text NOT NULL,
  emoji text NOT NULL,
  role_id text NOT NULL,
  mode text NOT NULL DEFAULT 'toggle', -- 'toggle' | 'add' | 'remove' | 'unique'
  group_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, emoji)
);
CREATE INDEX idx_rr_guild ON public.reaction_roles (guild_id);
CREATE INDEX idx_rr_message ON public.reaction_roles (message_id);
GRANT SELECT ON public.reaction_roles TO anon, authenticated;
GRANT ALL ON public.reaction_roles TO service_role;
ALTER TABLE public.reaction_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reaction roles" ON public.reaction_roles FOR SELECT USING (true);

-- =========================================
-- MODERATION CASES
-- =========================================
CREATE TABLE public.mod_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  case_number bigint NOT NULL,
  user_id text NOT NULL,
  moderator_id text NOT NULL,
  action text NOT NULL, -- 'warn' | 'mute' | 'unmute' | 'kick' | 'ban' | 'unban' | 'timeout'
  reason text,
  duration_seconds integer,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guild_id, case_number)
);
CREATE INDEX idx_mod_cases_guild_user ON public.mod_cases (guild_id, user_id);
CREATE INDEX idx_mod_cases_active ON public.mod_cases (guild_id, active);
GRANT SELECT ON public.mod_cases TO anon, authenticated;
GRANT ALL ON public.mod_cases TO service_role;
ALTER TABLE public.mod_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read mod cases" ON public.mod_cases FOR SELECT USING (true);

-- =========================================
-- AUTOMOD
-- =========================================
CREATE TABLE public.automod_config (
  guild_id text PRIMARY KEY,
  anti_spam_enabled boolean NOT NULL DEFAULT false,
  anti_spam_threshold integer NOT NULL DEFAULT 5,
  anti_spam_interval integer NOT NULL DEFAULT 5,
  anti_invite_enabled boolean NOT NULL DEFAULT false,
  anti_link_enabled boolean NOT NULL DEFAULT false,
  anti_caps_enabled boolean NOT NULL DEFAULT false,
  anti_caps_threshold integer NOT NULL DEFAULT 70,
  anti_mention_enabled boolean NOT NULL DEFAULT false,
  anti_mention_threshold integer NOT NULL DEFAULT 5,
  blacklist_words text[] NOT NULL DEFAULT '{}',
  whitelist_channels text[] NOT NULL DEFAULT '{}',
  whitelist_roles text[] NOT NULL DEFAULT '{}',
  punishment text NOT NULL DEFAULT 'delete', -- 'delete' | 'warn' | 'mute' | 'kick' | 'ban'
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.automod_config TO anon, authenticated;
GRANT ALL ON public.automod_config TO service_role;
ALTER TABLE public.automod_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read automod" ON public.automod_config FOR SELECT USING (true);
CREATE TRIGGER trg_automod_updated BEFORE UPDATE ON public.automod_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================
-- LEVELING
-- =========================================
CREATE TABLE public.leveling_config (
  guild_id text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  xp_per_message_min integer NOT NULL DEFAULT 15,
  xp_per_message_max integer NOT NULL DEFAULT 25,
  cooldown_seconds integer NOT NULL DEFAULT 60,
  level_up_channel_id text,
  level_up_message text NOT NULL DEFAULT '🎉 GG {user}, você subiu para o nível **{level}**!',
  level_up_dm boolean NOT NULL DEFAULT false,
  no_xp_channels text[] NOT NULL DEFAULT '{}',
  no_xp_roles text[] NOT NULL DEFAULT '{}',
  stack_rewards boolean NOT NULL DEFAULT false,
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.leveling_config TO anon, authenticated;
GRANT ALL ON public.leveling_config TO service_role;
ALTER TABLE public.leveling_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read leveling config" ON public.leveling_config FOR SELECT USING (true);
CREATE TRIGGER trg_leveling_updated BEFORE UPDATE ON public.leveling_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.user_levels (
  guild_id text NOT NULL,
  user_id text NOT NULL,
  xp bigint NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 0,
  messages bigint NOT NULL DEFAULT 0,
  last_message_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, user_id)
);
CREATE INDEX idx_user_levels_rank ON public.user_levels (guild_id, xp DESC);
GRANT SELECT ON public.user_levels TO anon, authenticated;
GRANT ALL ON public.user_levels TO service_role;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read user levels" ON public.user_levels FOR SELECT USING (true);

CREATE TABLE public.level_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  level integer NOT NULL,
  role_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guild_id, level, role_id)
);
CREATE INDEX idx_lr_guild ON public.level_rewards (guild_id);
GRANT SELECT ON public.level_rewards TO anon, authenticated;
GRANT ALL ON public.level_rewards TO service_role;
ALTER TABLE public.level_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read level rewards" ON public.level_rewards FOR SELECT USING (true);

-- =========================================
-- ECONOMY
-- =========================================
CREATE TABLE public.economy_config (
  guild_id text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  currency_name text NOT NULL DEFAULT 'moedas',
  currency_emoji text NOT NULL DEFAULT '💰',
  daily_amount integer NOT NULL DEFAULT 100,
  work_min integer NOT NULL DEFAULT 50,
  work_max integer NOT NULL DEFAULT 200,
  work_cooldown_seconds integer NOT NULL DEFAULT 3600,
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.economy_config TO anon, authenticated;
GRANT ALL ON public.economy_config TO service_role;
ALTER TABLE public.economy_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read economy config" ON public.economy_config FOR SELECT USING (true);
CREATE TRIGGER trg_economy_updated BEFORE UPDATE ON public.economy_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.user_economy (
  guild_id text NOT NULL,
  user_id text NOT NULL,
  balance bigint NOT NULL DEFAULT 0,
  bank bigint NOT NULL DEFAULT 0,
  last_daily_at timestamptz,
  last_work_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, user_id)
);
GRANT SELECT ON public.user_economy TO anon, authenticated;
GRANT ALL ON public.user_economy TO service_role;
ALTER TABLE public.user_economy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read user economy" ON public.user_economy FOR SELECT USING (true);

CREATE TABLE public.shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  name text NOT NULL,
  description text,
  price bigint NOT NULL,
  type text NOT NULL DEFAULT 'role', -- 'role' | 'custom'
  role_id text,
  stock integer,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_shop_guild ON public.shop_items (guild_id);
GRANT SELECT ON public.shop_items TO anon, authenticated;
GRANT ALL ON public.shop_items TO service_role;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shop" ON public.shop_items FOR SELECT USING (true);
CREATE TRIGGER trg_shop_updated BEFORE UPDATE ON public.shop_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================
-- CUSTOM COMMANDS
-- =========================================
CREATE TABLE public.custom_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  response_text text,
  embed jsonb,
  required_roles text[] NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  uses bigint NOT NULL DEFAULT 0,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guild_id, name)
);
CREATE INDEX idx_cc_guild ON public.custom_commands (guild_id);
GRANT SELECT ON public.custom_commands TO anon, authenticated;
GRANT ALL ON public.custom_commands TO service_role;
ALTER TABLE public.custom_commands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read custom commands" ON public.custom_commands FOR SELECT USING (true);
CREATE TRIGGER trg_cc_updated BEFORE UPDATE ON public.custom_commands
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================
-- EMBED TEMPLATES (editor unificado)
-- =========================================
CREATE TABLE public.embed_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  name text NOT NULL,
  embed jsonb NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guild_id, name)
);
CREATE INDEX idx_embed_guild ON public.embed_templates (guild_id);
GRANT SELECT ON public.embed_templates TO anon, authenticated;
GRANT ALL ON public.embed_templates TO service_role;
ALTER TABLE public.embed_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read embed templates" ON public.embed_templates FOR SELECT USING (true);
CREATE TRIGGER trg_embed_updated BEFORE UPDATE ON public.embed_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
