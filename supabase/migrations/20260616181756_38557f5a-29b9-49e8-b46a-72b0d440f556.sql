
CREATE TABLE public.bot_assets (
  id uuid primary key default gen_random_uuid(),
  guild_id text,
  key text not null,
  name text not null,
  type text not null,
  module text not null,
  url text not null,
  active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE UNIQUE INDEX bot_assets_guild_key_uniq
  ON public.bot_assets (COALESCE(guild_id, '_global'), key);
CREATE INDEX bot_assets_guild_idx ON public.bot_assets (guild_id);
CREATE INDEX bot_assets_module_idx ON public.bot_assets (module);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bot_assets TO authenticated;
GRANT ALL ON public.bot_assets TO service_role;

ALTER TABLE public.bot_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bot_assets readable to authenticated"
  ON public.bot_assets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "bot_assets writes via service_role only"
  ON public.bot_assets FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE TRIGGER bot_assets_touch_updated_at
  BEFORE UPDATE ON public.bot_assets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
