
-- ============================================================
-- FASE 1: Segurança - Restringir acesso anônimo a tabelas sensíveis
-- e blindar writes em definições de badges/achievements/seasons
-- ============================================================

-- 1) Revogar SELECT do role 'anon' em tabelas com dados sensíveis.
-- O bot usa service_role (bypassa RLS); o dashboard usa supabaseAdmin (server) ou sessão autenticada.
REVOKE SELECT ON
  public.ticket_configs,
  public.tickets,
  public.ticket_messages,
  public.ticket_notes,
  public.ticket_logs,
  public.ticket_categories,
  public.ticket_permission_roles,
  public.ticket_quick_replies,
  public.ticket_tags,
  public.ticket_access_levels,
  public.warnings,
  public.punishments,
  public.mod_cases,
  public.mod_appeals,
  public.moderation_logs,
  public.moderation_configs,
  public.moderation_permission_roles,
  public.automod_config,
  public.blacklisted_words,
  public.temporary_actions,
  public.server_audit_logs,
  public.guild_logs_config,
  public.dashboard_permissions,
  public.user_economy,
  public.economy_transactions,
  public.economy_config,
  public.economy_missions,
  public.user_missions,
  public.shop_items,
  public.shop_rotations,
  public.shop_rotation_config,
  public.premium_activations,
  public.premium_activation_codes,
  public.premium_audit_log,
  public.premium_subscriptions,
  public.premium_feature_usage,
  public.premium_guild_config,
  public.premium_benefits,
  public.command_permissions,
  public.custom_commands,
  public.embed_templates,
  public.reaction_roles,
  public.guild_autoroles,
  public.suggestions,
  public.suggestion_votes,
  public.poll_votes,
  public.reputation_logs,
  public.social_profiles,
  public.level_logs,
  public.level_users,
  public.level_season_users,
  public.user_badges,
  public.user_achievements
FROM anon;

-- 2) Garantir que 'authenticated' e 'service_role' continuam com acesso pleno
-- (o dashboard usa estes papéis).
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'ticket_configs','tickets','ticket_messages','ticket_notes','ticket_logs',
    'ticket_categories','ticket_permission_roles','ticket_quick_replies','ticket_tags','ticket_access_levels',
    'warnings','punishments','mod_cases','mod_appeals','moderation_logs','moderation_configs',
    'moderation_permission_roles','automod_config','blacklisted_words','temporary_actions',
    'server_audit_logs','guild_logs_config','dashboard_permissions',
    'user_economy','economy_transactions','economy_config','economy_missions','user_missions',
    'shop_items','shop_rotations','shop_rotation_config',
    'premium_activations','premium_activation_codes','premium_audit_log','premium_subscriptions',
    'premium_feature_usage','premium_guild_config','premium_benefits',
    'command_permissions','custom_commands','embed_templates','reaction_roles','guild_autoroles',
    'suggestions','suggestion_votes','poll_votes','reputation_logs','social_profiles',
    'level_logs','level_users','level_season_users','user_badges','user_achievements'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- 3) Blindar writes nas DEFINIÇÕES (badges, achievements, level_seasons)
-- e em registros de progressão (user_badges, user_achievements, level_season_users):
-- somente service_role pode escrever. Leitura permanece para authenticated.
DO $$
DECLARE
  pol record;
  protected_tables text[] := ARRAY['badges','achievements','level_seasons','user_badges','user_achievements','level_season_users'];
  t text;
BEGIN
  -- Drop policies "ALL" abertas
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename = ANY(protected_tables)
      AND cmd IN ('ALL')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;

  FOREACH t IN ARRAY protected_tables LOOP
    -- Garantir RLS habilitado
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Permitir leitura para authenticated (apaga policy duplicada se já existir)
    EXECUTE format('DROP POLICY IF EXISTS "auth read %I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "auth read %I" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);

    -- service_role já bypassa RLS; nenhuma policy de write é criada para authenticated.
    -- Isso bloqueia INSERT/UPDATE/DELETE por usuários autenticados — só o backend (service_role) escreve.
  END LOOP;
END $$;

-- 4) Escopar premium_subscriptions, premium_activations, premium_feature_usage
-- para o próprio usuário (user_id = auth.uid()). premium_audit_log: apenas service_role.
-- Assume coluna user_id text (Discord ID) — leitura cruzada feita pelo backend via service_role.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename IN ('premium_subscriptions','premium_activations','premium_feature_usage','premium_audit_log')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_audit_log ENABLE ROW LEVEL SECURITY;

-- premium_audit_log: somente service_role (sem policy = ninguém via Data API; backend usa service_role)
-- premium_subscriptions/activations/feature_usage: nenhuma policy authenticated cross-user.
-- Frontend deve ler estes dados via server function (supabaseAdmin), não direto do cliente.

-- 5) Storage: rank-banners — usuário só mexe na própria pasta (primeiro segmento = uid)
DROP POLICY IF EXISTS "rank-banners insert" ON storage.objects;
DROP POLICY IF EXISTS "rank-banners update" ON storage.objects;
DROP POLICY IF EXISTS "rank-banners delete" ON storage.objects;
DROP POLICY IF EXISTS "rank-banners read"   ON storage.objects;

CREATE POLICY "rank-banners read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'rank-banners');

CREATE POLICY "rank-banners insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'rank-banners'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "rank-banners update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'rank-banners'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "rank-banners delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'rank-banners'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
