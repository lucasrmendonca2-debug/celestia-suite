CREATE TABLE public.bot_guild_presence (
  guild_id TEXT PRIMARY KEY,
  name TEXT,
  icon TEXT,
  owner_id TEXT,
  member_count INTEGER,
  present BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.bot_guild_presence TO service_role;

ALTER TABLE public.bot_guild_presence ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER bot_guild_presence_touch_updated_at
BEFORE UPDATE ON public.bot_guild_presence
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();