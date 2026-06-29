
-- Premium tables: drop anon-permissive bot_full_access, recreate restricted to service_role
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'premium_subscriptions','premium_activations','premium_audit_log',
    'server_audit_logs',
    'level_users','level_logs','social_profiles','user_missions','user_achievements','reputation_logs','marriages'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS bot_full_access ON public.%I', t);
    EXECUTE format($f$
      CREATE POLICY bot_full_access ON public.%I
        AS PERMISSIVE FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)
    $f$, t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;
