-- Seasons table
CREATE TABLE public.level_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  name text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT false,
  xp_multiplier numeric NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_level_seasons_guild ON public.level_seasons(guild_id);
CREATE INDEX idx_level_seasons_active ON public.level_seasons(guild_id, is_active);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.level_seasons TO authenticated;
GRANT ALL ON public.level_seasons TO service_role;
ALTER TABLE public.level_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage level_seasons" ON public.level_seasons FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_level_seasons_updated BEFORE UPDATE ON public.level_seasons
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Season user progress
CREATE TABLE public.level_season_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.level_seasons(id) ON DELETE CASCADE,
  guild_id text NOT NULL,
  user_id text NOT NULL,
  xp bigint NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 0,
  messages_count bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, user_id)
);
CREATE INDEX idx_lsu_season_xp ON public.level_season_users(season_id, xp DESC);
CREATE INDEX idx_lsu_guild_user ON public.level_season_users(guild_id, user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.level_season_users TO authenticated;
GRANT ALL ON public.level_season_users TO service_role;
ALTER TABLE public.level_season_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage level_season_users" ON public.level_season_users FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_lsu_updated BEFORE UPDATE ON public.level_season_users
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Social profile visual customization
ALTER TABLE public.social_profiles
  ADD COLUMN IF NOT EXISTS accent_color text,
  ADD COLUMN IF NOT EXISTS background_color text,
  ADD COLUMN IF NOT EXISTS text_color text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS card_style text NOT NULL DEFAULT 'default';

-- Active season pointer
ALTER TABLE public.social_config
  ADD COLUMN IF NOT EXISTS active_season_id uuid REFERENCES public.level_seasons(id) ON DELETE SET NULL;