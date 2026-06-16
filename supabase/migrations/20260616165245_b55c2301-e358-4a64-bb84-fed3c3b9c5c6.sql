CREATE TABLE public.command_permissions (
  guild_id text NOT NULL,
  command_name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  allowed_roles text[] NOT NULL DEFAULT '{}',
  denied_roles text[] NOT NULL DEFAULT '{}',
  allowed_channels text[] NOT NULL DEFAULT '{}',
  denied_channels text[] NOT NULL DEFAULT '{}',
  cooldown_override integer,
  staff_only boolean NOT NULL DEFAULT false,
  vip_only boolean NOT NULL DEFAULT false,
  premium_guild_only boolean NOT NULL DEFAULT false,
  hidden_from_help boolean NOT NULL DEFAULT false,
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, command_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.command_permissions TO authenticated;
GRANT ALL ON public.command_permissions TO service_role;

ALTER TABLE public.command_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read command permissions"
  ON public.command_permissions FOR SELECT
  USING (true);

CREATE POLICY "Service role manages command permissions"
  ON public.command_permissions FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER command_permissions_touch_updated_at
  BEFORE UPDATE ON public.command_permissions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX command_permissions_guild_idx ON public.command_permissions (guild_id);