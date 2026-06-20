CREATE POLICY "Backend manages bot guild presence"
ON public.bot_guild_presence
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);