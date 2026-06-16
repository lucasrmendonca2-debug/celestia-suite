ALTER TABLE public.social_config
  ADD COLUMN IF NOT EXISTS card_accent_color text NOT NULL DEFAULT '#5865F2',
  ADD COLUMN IF NOT EXISTS card_background_color text NOT NULL DEFAULT '#0f1117',
  ADD COLUMN IF NOT EXISTS card_text_color text NOT NULL DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS card_style text NOT NULL DEFAULT 'default';