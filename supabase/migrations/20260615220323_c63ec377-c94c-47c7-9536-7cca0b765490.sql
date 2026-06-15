
CREATE TABLE public.guild_configs (
  guild_id TEXT PRIMARY KEY,
  welcome_enabled BOOLEAN NOT NULL DEFAULT false,
  welcome_channel_id TEXT,
  welcome_message TEXT NOT NULL DEFAULT 'Bem-vindo(a) ao {server}, {user}! 🎉',
  welcome_embed_enabled BOOLEAN NOT NULL DEFAULT true,
  welcome_embed_color TEXT NOT NULL DEFAULT '#5865F2',
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.guild_configs TO anon;
GRANT SELECT ON public.guild_configs TO authenticated;
GRANT ALL ON public.guild_configs TO service_role;

ALTER TABLE public.guild_configs ENABLE ROW LEVEL SECURITY;

-- Leitura pública (o bot externo lê com a anon key).
CREATE POLICY "Public read guild configs"
  ON public.guild_configs FOR SELECT
  USING (true);

-- Escrita só via service_role (dashboard server fn). Nenhuma policy para anon/authenticated = sem write.

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER guild_configs_touch_updated_at
BEFORE UPDATE ON public.guild_configs
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
