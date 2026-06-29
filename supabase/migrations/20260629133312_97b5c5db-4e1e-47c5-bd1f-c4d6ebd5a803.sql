
-- Restrict bot_full_access policies from anon to service_role only across sensitive tables.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'daily_tokens',
    'warnings',
    'mod_cases',
    'punishments',
    'mod_appeals',
    'moderation_logs',
    'premium_activation_codes'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS bot_full_access ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY bot_full_access ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      t
    );
    -- Revoke any direct anon grants that bypass policies
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;

-- Convert premium codes deny policy to RESTRICTIVE so it actually blocks
DROP POLICY IF EXISTS "premium_codes deny all auth" ON public.premium_activation_codes;
CREATE POLICY "premium_codes deny all auth"
  ON public.premium_activation_codes
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
