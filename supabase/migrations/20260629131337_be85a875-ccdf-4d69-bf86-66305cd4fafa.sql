
-- economy_transactions: substituir a policy aberta por uma de dono
DROP POLICY IF EXISTS bot_full_access ON public.economy_transactions;

CREATE POLICY "service role full access"
ON public.economy_transactions
FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "users read own transactions"
ON public.economy_transactions
FOR SELECT TO authenticated
USING (user_id = (auth.jwt() ->> 'user_metadata')::jsonb ->> 'provider_id'
       OR user_id = auth.jwt() ->> 'sub');

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.economy_transactions FROM anon;

-- announcements: somente service_role
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.announcements FROM anon, authenticated;
GRANT ALL ON public.announcements TO service_role;

DROP POLICY IF EXISTS "service role full access" ON public.announcements;
CREATE POLICY "service role full access"
ON public.announcements
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- automod_incidents: somente service_role
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.automod_incidents FROM anon, authenticated;
GRANT ALL ON public.automod_incidents TO service_role;

DROP POLICY IF EXISTS bot_full_access ON public.automod_incidents;
DROP POLICY IF EXISTS "service role full access" ON public.automod_incidents;
CREATE POLICY "service role full access"
ON public.automod_incidents
FOR ALL TO service_role
USING (true) WITH CHECK (true);
