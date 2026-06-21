
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'temporary_actions','command_permissions','guild_configs','economy_config',
    'premium_guild_config','social_config','community_config','warnings','mod_cases',
    'moderation_configs','moderation_logs','moderation_permission_roles','mod_appeals',
    'automod_config','blacklisted_words','custom_commands','embed_templates',
    'guild_autoroles','guild_logs_config','reaction_roles','dashboard_permissions',
    'level_config','level_logs','level_rewards','level_rewards_legacy',
    'level_season_users','level_seasons','level_users','leveling_config_legacy',
    'user_levels_legacy','reputation_logs','social_profiles','achievements',
    'user_achievements','badges','user_badges','economy_missions',
    'economy_transactions','user_economy','user_missions','shop_items',
    'shop_rotation_config','shop_rotations','polls','poll_votes',
    'suggestions','suggestion_votes','tickets','ticket_access_levels',
    'ticket_categories','ticket_configs','ticket_logs','ticket_messages',
    'ticket_notes','ticket_permission_roles','ticket_quick_replies','ticket_tags',
    'premium_activation_codes','premium_activations','premium_audit_log',
    'premium_benefits','premium_feature_usage','premium_plans','premium_subscriptions',
    'punishments','server_audit_logs','bot_assets','bot_guild_presence',
    'allowed_domains'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('DROP POLICY IF EXISTS "bot_full_access" ON public.%I', t);
    EXECUTE format('CREATE POLICY "bot_full_access" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
