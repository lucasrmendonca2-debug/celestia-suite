
-- ===========================================================================
-- FASE 4 — LOGS DO SERVIDOR + TICKETS V2
-- ===========================================================================

-- ---------- A) guild_logs_config: novos canais e toggles ----------

ALTER TABLE public.guild_logs_config
  ADD COLUMN IF NOT EXISTS message_channel_id text,
  ADD COLUMN IF NOT EXISTS member_channel_id text,
  ADD COLUMN IF NOT EXISTS role_channel_id text,
  ADD COLUMN IF NOT EXISTS channel_channel_id text,
  ADD COLUMN IF NOT EXISTS voice_channel_id text,
  ADD COLUMN IF NOT EXISTS server_channel_id text,
  ADD COLUMN IF NOT EXISTS mod_channel_id text,
  ADD COLUMN IF NOT EXISTS invite_channel_id text,
  ADD COLUMN IF NOT EXISTS user_update boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS member_timeout boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS server_update boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invite_create boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invite_delete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS emoji_update boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ignored_channels text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ignored_roles text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ignored_users text[] NOT NULL DEFAULT '{}'::text[];

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guild_logs_config TO authenticated;
GRANT ALL ON public.guild_logs_config TO service_role;

-- ---------- B) server_audit_logs ----------

CREATE TABLE IF NOT EXISTS public.server_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  category text NOT NULL,
  event text NOT NULL,
  actor_id text,
  actor_tag text,
  target_id text,
  target_tag text,
  channel_id text,
  before jsonb,
  after jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.server_audit_logs TO authenticated;
GRANT ALL ON public.server_audit_logs TO service_role;

ALTER TABLE public.server_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read audit logs" ON public.server_audit_logs FOR SELECT USING (true);
CREATE POLICY "Service writes audit logs" ON public.server_audit_logs FOR INSERT TO service_role WITH CHECK (true);

CREATE INDEX IF NOT EXISTS server_audit_logs_guild_idx ON public.server_audit_logs (guild_id, created_at DESC);
CREATE INDEX IF NOT EXISTS server_audit_logs_category_idx ON public.server_audit_logs (guild_id, category, created_at DESC);
CREATE INDEX IF NOT EXISTS server_audit_logs_actor_idx ON public.server_audit_logs (guild_id, actor_id);
CREATE INDEX IF NOT EXISTS server_audit_logs_target_idx ON public.server_audit_logs (guild_id, target_id);

-- ---------- C) tickets v2: novas colunas ----------

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS priority_level text NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS first_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS rating_comment text,
  ADD COLUMN IF NOT EXISTS sla_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS reopened_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_user_message_at timestamptz;

ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_priority_level_check;
ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_priority_level_check
  CHECK (priority_level IN ('LOW','MEDIUM','HIGH','URGENT'));

CREATE INDEX IF NOT EXISTS tickets_priority_idx ON public.tickets (guild_id, priority_level);
CREATE INDEX IF NOT EXISTS tickets_claimed_idx ON public.tickets (guild_id, claimed_by);

-- ---------- D) ticket_categories v2 ----------

ALTER TABLE public.ticket_categories
  ADD COLUMN IF NOT EXISTS claim_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_close_hours integer,
  ADD COLUMN IF NOT EXISTS priority_default text NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS first_response_minutes integer,
  ADD COLUMN IF NOT EXISTS sla_alert_role_id text;

ALTER TABLE public.ticket_categories DROP CONSTRAINT IF EXISTS ticket_categories_priority_default_check;
ALTER TABLE public.ticket_categories
  ADD CONSTRAINT ticket_categories_priority_default_check
  CHECK (priority_default IN ('LOW','MEDIUM','HIGH','URGENT'));

-- ---------- E) ticket_tags ----------

CREATE TABLE IF NOT EXISTS public.ticket_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#5865F2',
  emoji text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guild_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_tags TO authenticated;
GRANT ALL ON public.ticket_tags TO service_role;

ALTER TABLE public.ticket_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ticket tags" ON public.ticket_tags FOR SELECT USING (true);
CREATE POLICY "Service manage ticket tags" ON public.ticket_tags FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER ticket_tags_touch BEFORE UPDATE ON public.ticket_tags
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS ticket_tags_guild_idx ON public.ticket_tags (guild_id);

-- ---------- F) ticket_notes ----------

CREATE TABLE IF NOT EXISTS public.ticket_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  guild_id text NOT NULL,
  author_id text NOT NULL,
  author_tag text,
  content text NOT NULL,
  internal boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_notes TO authenticated;
GRANT ALL ON public.ticket_notes TO service_role;

ALTER TABLE public.ticket_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ticket notes" ON public.ticket_notes FOR SELECT USING (true);
CREATE POLICY "Service manage ticket notes" ON public.ticket_notes FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS ticket_notes_ticket_idx ON public.ticket_notes (ticket_id, created_at DESC);

-- ---------- G) Limpeza de logs antigos via pg_cron (>30d) ----------

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('server_audit_logs_cleanup');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'server_audit_logs_cleanup',
  '15 3 * * *',
  $$ DELETE FROM public.server_audit_logs WHERE created_at < now() - INTERVAL '30 days'; $$
);
