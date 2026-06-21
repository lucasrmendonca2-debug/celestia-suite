CREATE TABLE public.guild_multipliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('xp','coin')),
  target_type TEXT NOT NULL CHECK (target_type IN ('role','channel')),
  target_id TEXT NOT NULL,
  multiplier NUMERIC(6,2) NOT NULL DEFAULT 1.50 CHECK (multiplier >= 0 AND multiplier <= 100),
  label TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, kind, target_type, target_id)
);

CREATE INDEX guild_multipliers_guild_idx ON public.guild_multipliers (guild_id, kind, active);

GRANT ALL ON public.guild_multipliers TO service_role;

ALTER TABLE public.guild_multipliers ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER guild_multipliers_touch
BEFORE UPDATE ON public.guild_multipliers
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();