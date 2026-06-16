ALTER TABLE public.ticket_configs
  ADD COLUMN IF NOT EXISTS panel_image_url text,
  ADD COLUMN IF NOT EXISTS panel_thumbnail_url text,
  ADD COLUMN IF NOT EXISTS panel_use_guild_banner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS webhook_id text,
  ADD COLUMN IF NOT EXISTS webhook_token text,
  ADD COLUMN IF NOT EXISTS webhook_channel_id text,
  ADD COLUMN IF NOT EXISTS webhook_name text,
  ADD COLUMN IF NOT EXISTS webhook_avatar_url text;