
-- ============ moderation_configs ============
CREATE TABLE public.moderation_configs (
  guild_id text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  log_channel_id text,
  mute_role_id text,
  max_warnings integer NOT NULL DEFAULT 3,
  default_warn_punishment text NOT NULL DEFAULT 'none', -- none|mute|kick|ban|temp_mute|temp_ban
  default_warn_punishment_duration integer NOT NULL DEFAULT 3600, -- seconds
  default_mute_duration integer NOT NULL DEFAULT 600,
  allow_temporary_ban boolean NOT NULL DEFAULT true,
  allow_temporary_mute boolean NOT NULL DEFAULT true,
  delete_punished_messages boolean NOT NULL DEFAULT false,
  dm_punished_user boolean NOT NULL DEFAULT true,
  punishment_dm_template text NOT NULL DEFAULT 'Você recebeu **{action}** em **{guild}**.\n\n**Motivo:** {reason}\n**Duração:** {duration}',
  protected_role_ids text[] NOT NULL DEFAULT '{}'::text[],
  protected_user_ids text[] NOT NULL DEFAULT '{}'::text[],
  embed_color integer NOT NULL DEFAULT 15548997, -- red-ish
  embed_footer text NOT NULL DEFAULT 'Sistema de Moderação',
  embed_icon_url text,
  enabled_log_events text[] NOT NULL DEFAULT ARRAY['ban','unban','kick','mute','unmute','warn','removewarn','clear','lock','unlock','slowmode','automod','config_change']::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.moderation_configs TO anon, authenticated;
GRANT ALL ON public.moderation_configs TO service_role;
ALTER TABLE public.moderation_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read moderation configs" ON public.moderation_configs FOR SELECT USING (true);
CREATE TRIGGER moderation_configs_touch BEFORE UPDATE ON public.moderation_configs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ moderation_permission_roles ============
CREATE TABLE public.moderation_permission_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  role_id text NOT NULL,
  can_use_moderation boolean NOT NULL DEFAULT true,
  can_ban boolean NOT NULL DEFAULT false,
  can_unban boolean NOT NULL DEFAULT false,
  can_kick boolean NOT NULL DEFAULT false,
  can_mute boolean NOT NULL DEFAULT false,
  can_unmute boolean NOT NULL DEFAULT false,
  can_warn boolean NOT NULL DEFAULT false,
  can_remove_warn boolean NOT NULL DEFAULT false,
  can_clear_messages boolean NOT NULL DEFAULT false,
  can_lock_channel boolean NOT NULL DEFAULT false,
  can_unlock_channel boolean NOT NULL DEFAULT false,
  can_manage_automod boolean NOT NULL DEFAULT false,
  can_view_history boolean NOT NULL DEFAULT true,
  can_view_logs boolean NOT NULL DEFAULT false,
  can_manage_blacklist boolean NOT NULL DEFAULT false,
  can_manage_moderation_config boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guild_id, role_id)
);
CREATE INDEX moderation_permission_roles_guild_idx ON public.moderation_permission_roles (guild_id);
GRANT SELECT ON public.moderation_permission_roles TO anon, authenticated;
GRANT ALL ON public.moderation_permission_roles TO service_role;
ALTER TABLE public.moderation_permission_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read moderation perm roles" ON public.moderation_permission_roles FOR SELECT USING (true);
CREATE TRIGGER moderation_perm_roles_touch BEFORE UPDATE ON public.moderation_permission_roles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ punishments ============
CREATE TABLE public.punishments (
  id bigserial PRIMARY KEY,
  guild_id text NOT NULL,
  user_id text NOT NULL,
  username text,
  moderator_id text NOT NULL,
  moderator_name text,
  type text NOT NULL, -- BAN|TEMP_BAN|KICK|MUTE|TEMP_MUTE|WARN|CLEAR|LOCK|UNLOCK|SLOWMODE|UNBAN|UNMUTE
  reason text,
  duration_seconds integer,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX punishments_guild_user_idx ON public.punishments (guild_id, user_id, created_at DESC);
CREATE INDEX punishments_guild_active_idx ON public.punishments (guild_id, active);
CREATE INDEX punishments_expires_idx ON public.punishments (active, expires_at) WHERE expires_at IS NOT NULL;
GRANT SELECT ON public.punishments TO anon, authenticated;
GRANT ALL ON public.punishments TO service_role;
ALTER TABLE public.punishments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read punishments" ON public.punishments FOR SELECT USING (true);
CREATE TRIGGER punishments_touch BEFORE UPDATE ON public.punishments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ warnings ============
CREATE TABLE public.warnings (
  id bigserial PRIMARY KEY,
  guild_id text NOT NULL,
  user_id text NOT NULL,
  username text,
  moderator_id text NOT NULL,
  moderator_name text,
  reason text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX warnings_guild_user_idx ON public.warnings (guild_id, user_id, active, created_at DESC);
GRANT SELECT ON public.warnings TO anon, authenticated;
GRANT ALL ON public.warnings TO service_role;
ALTER TABLE public.warnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read warnings" ON public.warnings FOR SELECT USING (true);
CREATE TRIGGER warnings_touch BEFORE UPDATE ON public.warnings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ moderation_logs ============
CREATE TABLE public.moderation_logs (
  id bigserial PRIMARY KEY,
  guild_id text NOT NULL,
  user_id text,
  moderator_id text,
  action text NOT NULL,
  reason text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX moderation_logs_guild_idx ON public.moderation_logs (guild_id, created_at DESC);
GRANT SELECT ON public.moderation_logs TO anon, authenticated;
GRANT ALL ON public.moderation_logs TO service_role;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read moderation logs" ON public.moderation_logs FOR SELECT USING (true);

-- ============ blacklisted_words ============
CREATE TABLE public.blacklisted_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  word text NOT NULL,
  punishment text NOT NULL DEFAULT 'delete', -- delete|warn|mute|kick|ban
  delete_message boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guild_id, word)
);
CREATE INDEX blacklisted_words_guild_idx ON public.blacklisted_words (guild_id, active);
GRANT SELECT ON public.blacklisted_words TO anon, authenticated;
GRANT ALL ON public.blacklisted_words TO service_role;
ALTER TABLE public.blacklisted_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read blacklisted words" ON public.blacklisted_words FOR SELECT USING (true);
CREATE TRIGGER blacklisted_words_touch BEFORE UPDATE ON public.blacklisted_words
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ allowed_domains ============
CREATE TABLE public.allowed_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  domain text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guild_id, domain)
);
CREATE INDEX allowed_domains_guild_idx ON public.allowed_domains (guild_id);
GRANT SELECT ON public.allowed_domains TO anon, authenticated;
GRANT ALL ON public.allowed_domains TO service_role;
ALTER TABLE public.allowed_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read allowed domains" ON public.allowed_domains FOR SELECT USING (true);
CREATE TRIGGER allowed_domains_touch BEFORE UPDATE ON public.allowed_domains
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ temporary_actions ============
CREATE TABLE public.temporary_actions (
  id bigserial PRIMARY KEY,
  guild_id text NOT NULL,
  user_id text NOT NULL,
  action_type text NOT NULL, -- TEMP_BAN|TEMP_MUTE
  expires_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  punishment_id bigint REFERENCES public.punishments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX temporary_actions_expires_idx ON public.temporary_actions (active, expires_at);
GRANT SELECT ON public.temporary_actions TO anon, authenticated;
GRANT ALL ON public.temporary_actions TO service_role;
ALTER TABLE public.temporary_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read temporary actions" ON public.temporary_actions FOR SELECT USING (true);
CREATE TRIGGER temporary_actions_touch BEFORE UPDATE ON public.temporary_actions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ extend automod_config ============
ALTER TABLE public.automod_config
  ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anti_flood_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anti_flood_threshold integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS spam_punishment text NOT NULL DEFAULT 'delete',
  ADD COLUMN IF NOT EXISTS link_punishment text NOT NULL DEFAULT 'delete',
  ADD COLUMN IF NOT EXISTS invite_punishment text NOT NULL DEFAULT 'delete',
  ADD COLUMN IF NOT EXISTS blacklist_punishment text NOT NULL DEFAULT 'delete',
  ADD COLUMN IF NOT EXISTS spam_punishment_duration integer NOT NULL DEFAULT 600,
  ADD COLUMN IF NOT EXISTS whitelist_users text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS warn_user_on_delete boolean NOT NULL DEFAULT true;
