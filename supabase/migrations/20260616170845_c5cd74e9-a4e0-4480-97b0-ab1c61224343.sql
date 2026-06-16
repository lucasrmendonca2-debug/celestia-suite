
CREATE TABLE public.shop_rotation_config (
  guild_id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  slot_count INTEGER NOT NULL DEFAULT 5,
  rotation_hours INTEGER NOT NULL DEFAULT 12,
  max_discount_pct INTEGER NOT NULL DEFAULT 40,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shop_rotation_config TO anon, authenticated;
GRANT ALL ON public.shop_rotation_config TO service_role;
ALTER TABLE public.shop_rotation_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_rot_cfg_read" ON public.shop_rotation_config FOR SELECT USING (true);
CREATE TRIGGER shop_rotation_config_touch BEFORE UPDATE ON public.shop_rotation_config FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.shop_rotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  discount_pct INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shop_rotations TO anon, authenticated;
GRANT ALL ON public.shop_rotations TO service_role;
ALTER TABLE public.shop_rotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_rot_read" ON public.shop_rotations FOR SELECT USING (true);
CREATE INDEX shop_rotations_guild_exp_idx ON public.shop_rotations (guild_id, expires_at DESC);
