GRANT SELECT ON public.guild_configs TO anon;
GRANT SELECT ON public.guild_configs TO authenticated;
GRANT ALL ON public.guild_configs TO service_role;

DROP POLICY IF EXISTS "Service role manages guild configs" ON public.guild_configs;
CREATE POLICY "Service role manages guild configs"
  ON public.guild_configs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);