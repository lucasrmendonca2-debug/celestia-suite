
CREATE TABLE public.dashboard_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  role_id text NOT NULL,
  areas text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guild_id, role_id)
);

GRANT ALL ON public.dashboard_permissions TO service_role;
GRANT SELECT ON public.dashboard_permissions TO anon;

ALTER TABLE public.dashboard_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read dashboard permissions"
  ON public.dashboard_permissions FOR SELECT
  USING (true);

CREATE TRIGGER touch_dashboard_permissions_updated_at
  BEFORE UPDATE ON public.dashboard_permissions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX dashboard_permissions_guild_idx ON public.dashboard_permissions (guild_id);
