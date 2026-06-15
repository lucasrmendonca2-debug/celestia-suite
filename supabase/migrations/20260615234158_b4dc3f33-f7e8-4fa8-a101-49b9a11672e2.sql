-- ============== TICKETS SYSTEM — Phase 1 schema ==============

-- 1) ticket_configs (1 per guild)
CREATE TABLE public.ticket_configs (
  guild_id text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  panel_channel_id text,
  panel_message_id text,
  category_id text,                -- discord category where channels are created
  default_support_role_id text,
  log_channel_id text,
  max_open_tickets_per_user int NOT NULL DEFAULT 1,
  panel_title text NOT NULL DEFAULT '🎫 Central de Atendimento',
  panel_description text NOT NULL DEFAULT 'Precisa de ajuda? Abra um ticket clicando no botão abaixo. Nossa equipe vai te atender por aqui em instantes.',
  panel_button_label text NOT NULL DEFAULT 'Abrir ticket',
  panel_button_emoji text NOT NULL DEFAULT '🎫',
  panel_color int NOT NULL DEFAULT 8141549,
  ticket_welcome_message text NOT NULL DEFAULT 'Olá {user}! 👋 Conta pra gente como podemos te ajudar — alguém da equipe já vem aqui.',
  close_message text NOT NULL DEFAULT 'Este ticket foi fechado por {staff}. Se precisar continuar o atendimento, peça pra equipe reabrir.',
  transcript_enabled boolean NOT NULL DEFAULT true,
  rating_enabled boolean NOT NULL DEFAULT false,
  allow_user_close_ticket boolean NOT NULL DEFAULT true,
  use_single_panel boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ticket_configs TO anon, authenticated;
GRANT ALL ON public.ticket_configs TO service_role;
ALTER TABLE public.ticket_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ticket configs" ON public.ticket_configs FOR SELECT USING (true);
CREATE TRIGGER ticket_configs_touch BEFORE UPDATE ON public.ticket_configs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) ticket_categories
CREATE TABLE public.ticket_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  name text NOT NULL,
  description text,
  emoji text DEFAULT '🎫',
  support_role_id text,
  discord_category_id text,
  active boolean NOT NULL DEFAULT true,
  priority boolean NOT NULL DEFAULT false,
  required_role_ids text[] NOT NULL DEFAULT '{}',
  blocked_role_ids text[] NOT NULL DEFAULT '{}',
  allowed_access_levels text[] NOT NULL DEFAULT '{}',
  max_open_tickets_per_user int,
  welcome_message text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ticket_categories_guild_idx ON public.ticket_categories(guild_id);
GRANT SELECT ON public.ticket_categories TO anon, authenticated;
GRANT ALL ON public.ticket_categories TO service_role;
ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ticket categories" ON public.ticket_categories FOR SELECT USING (true);
CREATE TRIGGER ticket_categories_touch BEFORE UPDATE ON public.ticket_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3) ticket_access_levels (renomeáveis por guild)
CREATE TABLE public.ticket_access_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  key text NOT NULL,              -- 'member','vip','support','manager','admin','owner' OR custom
  name text NOT NULL,
  rank int NOT NULL DEFAULT 0,    -- maior = mais poder
  role_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(guild_id, key)
);
CREATE INDEX ticket_access_levels_guild_idx ON public.ticket_access_levels(guild_id);
GRANT SELECT ON public.ticket_access_levels TO anon, authenticated;
GRANT ALL ON public.ticket_access_levels TO service_role;
ALTER TABLE public.ticket_access_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ticket access levels" ON public.ticket_access_levels FOR SELECT USING (true);
CREATE TRIGGER ticket_access_levels_touch BEFORE UPDATE ON public.ticket_access_levels
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) ticket_permission_roles (matriz de permissões por cargo)
CREATE TABLE public.ticket_permission_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  role_id text NOT NULL,
  access_level text NOT NULL DEFAULT 'member',
  can_view_panel boolean NOT NULL DEFAULT true,
  can_open_ticket boolean NOT NULL DEFAULT true,
  can_open_priority_ticket boolean NOT NULL DEFAULT false,
  can_close_ticket boolean NOT NULL DEFAULT false,
  can_reopen_ticket boolean NOT NULL DEFAULT false,
  can_delete_ticket boolean NOT NULL DEFAULT false,
  can_claim_ticket boolean NOT NULL DEFAULT false,
  can_add_user boolean NOT NULL DEFAULT false,
  can_remove_user boolean NOT NULL DEFAULT false,
  can_generate_transcript boolean NOT NULL DEFAULT false,
  can_view_history boolean NOT NULL DEFAULT false,
  can_view_ratings boolean NOT NULL DEFAULT false,
  can_manage_config boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(guild_id, role_id)
);
CREATE INDEX ticket_permission_roles_guild_idx ON public.ticket_permission_roles(guild_id);
GRANT SELECT ON public.ticket_permission_roles TO anon, authenticated;
GRANT ALL ON public.ticket_permission_roles TO service_role;
ALTER TABLE public.ticket_permission_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ticket permission roles" ON public.ticket_permission_roles FOR SELECT USING (true);
CREATE TRIGGER ticket_permission_roles_touch BEFORE UPDATE ON public.ticket_permission_roles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5) tickets
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  channel_id text NOT NULL UNIQUE,
  user_id text NOT NULL,
  username text NOT NULL,
  category_id uuid REFERENCES public.ticket_categories(id) ON DELETE SET NULL,
  category_name text,
  status text NOT NULL DEFAULT 'open',  -- open | closed | deleted
  priority boolean NOT NULL DEFAULT false,
  claimed_by text,
  closed_by text,
  close_reason text,
  rating int CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  transcript_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tickets_guild_status_idx ON public.tickets(guild_id, status);
CREATE INDEX tickets_user_idx ON public.tickets(guild_id, user_id, status);
GRANT SELECT ON public.tickets TO anon, authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tickets" ON public.tickets FOR SELECT USING (true);
CREATE TRIGGER tickets_touch BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6) ticket_messages (cache para transcript)
CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id text NOT NULL,
  author_name text NOT NULL,
  content text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ticket_messages_ticket_idx ON public.ticket_messages(ticket_id, created_at);
GRANT SELECT ON public.ticket_messages TO anon, authenticated;
GRANT ALL ON public.ticket_messages TO service_role;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ticket messages" ON public.ticket_messages FOR SELECT USING (true);

-- 7) ticket_logs
CREATE TABLE public.ticket_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
  action text NOT NULL,  -- opened | closed | reopened | deleted | claimed | user_added | user_removed | transcript | rating | config_changed | permission_changed
  user_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ticket_logs_guild_idx ON public.ticket_logs(guild_id, created_at DESC);
CREATE INDEX ticket_logs_ticket_idx ON public.ticket_logs(ticket_id, created_at);
GRANT SELECT ON public.ticket_logs TO anon, authenticated;
GRANT ALL ON public.ticket_logs TO service_role;
ALTER TABLE public.ticket_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ticket logs" ON public.ticket_logs FOR SELECT USING (true);
