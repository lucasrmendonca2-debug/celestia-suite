DROP POLICY IF EXISTS "Service role manages guild configs" ON public.guild_configs;
CREATE POLICY "Service role manages guild configs"
  ON public.guild_configs
  FOR ALL
  TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');