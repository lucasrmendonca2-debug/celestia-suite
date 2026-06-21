
CREATE TABLE IF NOT EXISTS public.app_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  level text NOT NULL CHECK (level IN ('error','warn','info')),
  source text NOT NULL CHECK (source IN ('client','server','serverfn','boundary')),
  message text NOT NULL,
  stack text,
  route text,
  user_id text,
  user_tag text,
  guild_id text,
  user_agent text,
  fingerprint text,
  count int NOT NULL DEFAULT 1,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  resolved boolean NOT NULL DEFAULT false,
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS app_error_logs_created_idx ON public.app_error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS app_error_logs_fingerprint_idx ON public.app_error_logs (fingerprint);
CREATE INDEX IF NOT EXISTS app_error_logs_resolved_idx ON public.app_error_logs (resolved, created_at DESC);

GRANT ALL ON public.app_error_logs TO service_role;
ALTER TABLE public.app_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only"
ON public.app_error_logs FOR ALL
TO service_role
USING (true) WITH CHECK (true);
