-- Fase 3 — Moderação Profissional Avançada

-- 1. Upgrade da tabela warnings (severidade, expiração, prova, pontos)
ALTER TABLE public.warnings
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS proof_url text,
  ADD COLUMN IF NOT EXISTS points int NOT NULL DEFAULT 1;

ALTER TABLE public.warnings
  DROP CONSTRAINT IF EXISTS warnings_severity_check;
ALTER TABLE public.warnings
  ADD CONSTRAINT warnings_severity_check
  CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH'));

CREATE INDEX IF NOT EXISTS warnings_expires_at_idx
  ON public.warnings (expires_at) WHERE active = true AND expires_at IS NOT NULL;

-- 2. Upgrade da tabela moderation_configs (config de warns avançada)
ALTER TABLE public.moderation_configs
  ADD COLUMN IF NOT EXISTS warn_expiry_days int NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS appeal_url text,
  ADD COLUMN IF NOT EXISTS warn_points_low int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS warn_points_medium int NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS warn_points_high int NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS logs_retention_days int NOT NULL DEFAULT 180,
  ADD COLUMN IF NOT EXISTS audit_log_enabled boolean NOT NULL DEFAULT true;

-- 3. Upgrade da tabela mod_cases (source, edição, prova, severidade)
ALTER TABLE public.mod_cases
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'BOT',
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS edited_by text,
  ADD COLUMN IF NOT EXISTS proof_url text,
  ADD COLUMN IF NOT EXISTS severity text,
  ADD COLUMN IF NOT EXISTS user_tag text,
  ADD COLUMN IF NOT EXISTS moderator_tag text;

ALTER TABLE public.mod_cases
  DROP CONSTRAINT IF EXISTS mod_cases_source_check;
ALTER TABLE public.mod_cases
  ADD CONSTRAINT mod_cases_source_check
  CHECK (source IN ('BOT', 'DISCORD_UI', 'DASHBOARD', 'AUTOMOD'));

CREATE INDEX IF NOT EXISTS mod_cases_guild_user_idx
  ON public.mod_cases (guild_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS mod_cases_guild_case_number_idx
  ON public.mod_cases (guild_id, case_number DESC);

-- 4. Função para auto-incrementar case_number por guild
CREATE OR REPLACE FUNCTION public.next_case_number(_guild_id text)
RETURNS int
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(case_number), 0) + 1
  FROM public.mod_cases
  WHERE guild_id = _guild_id;
$$;

-- 5. Garantir que o type da action no mod_cases aceita NOTE
-- (sem constraint estrita pois action é text livre)

-- 6. View de estatísticas de moderação (modstats)
CREATE OR REPLACE VIEW public.moderation_stats_30d AS
SELECT
  guild_id,
  moderator_id,
  action,
  COUNT(*) AS total
FROM public.mod_cases
WHERE created_at >= now() - interval '30 days'
GROUP BY guild_id, moderator_id, action;

GRANT SELECT ON public.moderation_stats_30d TO authenticated;
GRANT ALL ON public.moderation_stats_30d TO service_role;