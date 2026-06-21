
-- ============================================================
-- Drop public/anon SELECT policies on sensitive tables.
-- Service_role (used by dashboard + bot) bypasses RLS and keeps working.
-- ============================================================

DROP POLICY IF EXISTS "Public read automod" ON public.automod_config;
DROP POLICY IF EXISTS "Public read blacklisted words" ON public.blacklisted_words;
DROP POLICY IF EXISTS "Public read command permissions" ON public.command_permissions;
DROP POLICY IF EXISTS "Public read custom commands" ON public.custom_commands;
DROP POLICY IF EXISTS "Public read dashboard permissions" ON public.dashboard_permissions;
DROP POLICY IF EXISTS "Public read economy config" ON public.economy_config;
DROP POLICY IF EXISTS "missions_read" ON public.economy_missions;
DROP POLICY IF EXISTS "tx_read" ON public.economy_transactions;
DROP POLICY IF EXISTS "Public read embed templates" ON public.embed_templates;
DROP POLICY IF EXISTS "Public read autoroles" ON public.guild_autoroles;
DROP POLICY IF EXISTS "Public read guild configs" ON public.guild_configs;
DROP POLICY IF EXISTS "Public read logs config" ON public.guild_logs_config;
DROP POLICY IF EXISTS "Public read level rewards" ON public.level_rewards_legacy;
DROP POLICY IF EXISTS "Public read leveling config" ON public.leveling_config_legacy;
DROP POLICY IF EXISTS "appeals_read" ON public.mod_appeals;
DROP POLICY IF EXISTS "Public read mod cases" ON public.mod_cases;
DROP POLICY IF EXISTS "Public read moderation configs" ON public.moderation_configs;
DROP POLICY IF EXISTS "Public read moderation logs" ON public.moderation_logs;
DROP POLICY IF EXISTS "Public read moderation perm roles" ON public.moderation_permission_roles;
DROP POLICY IF EXISTS "Public read punishments" ON public.punishments;
DROP POLICY IF EXISTS "Public read reaction roles" ON public.reaction_roles;
DROP POLICY IF EXISTS "Public read audit logs" ON public.server_audit_logs;
DROP POLICY IF EXISTS "Public read shop" ON public.shop_items;
DROP POLICY IF EXISTS "shop_rot_cfg_read" ON public.shop_rotation_config;
DROP POLICY IF EXISTS "shop_rot_read" ON public.shop_rotations;
DROP POLICY IF EXISTS "Public read temporary actions" ON public.temporary_actions;
DROP POLICY IF EXISTS "Public read ticket access levels" ON public.ticket_access_levels;
DROP POLICY IF EXISTS "Public read ticket categories" ON public.ticket_categories;
DROP POLICY IF EXISTS "Public read ticket configs" ON public.ticket_configs;
DROP POLICY IF EXISTS "Public read ticket logs" ON public.ticket_logs;
DROP POLICY IF EXISTS "Public read ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Public read ticket notes" ON public.ticket_notes;
DROP POLICY IF EXISTS "Public read ticket permission roles" ON public.ticket_permission_roles;
DROP POLICY IF EXISTS "quick_replies_read" ON public.ticket_quick_replies;
DROP POLICY IF EXISTS "Public read ticket tags" ON public.ticket_tags;
DROP POLICY IF EXISTS "Public read tickets" ON public.tickets;
DROP POLICY IF EXISTS "Public read user economy" ON public.user_economy;
DROP POLICY IF EXISTS "Public read user levels" ON public.user_levels_legacy;
DROP POLICY IF EXISTS "user_missions_read" ON public.user_missions;
DROP POLICY IF EXISTS "Public read warnings" ON public.warnings;
DROP POLICY IF EXISTS "Public read allowed domains" ON public.allowed_domains;

-- Revoke anon SELECT grants on the same tables (RLS + revoked grant = doubly safe).
REVOKE SELECT ON public.automod_config, public.blacklisted_words, public.command_permissions,
  public.custom_commands, public.dashboard_permissions, public.economy_config,
  public.economy_missions, public.economy_transactions, public.embed_templates,
  public.guild_autoroles, public.guild_configs, public.guild_logs_config,
  public.level_rewards_legacy, public.leveling_config_legacy, public.mod_appeals,
  public.mod_cases, public.moderation_configs, public.moderation_logs,
  public.moderation_permission_roles, public.punishments, public.reaction_roles,
  public.server_audit_logs, public.shop_items, public.shop_rotation_config,
  public.shop_rotations, public.temporary_actions, public.ticket_access_levels,
  public.ticket_categories, public.ticket_configs, public.ticket_logs,
  public.ticket_messages, public.ticket_notes, public.ticket_permission_roles,
  public.ticket_quick_replies, public.ticket_tags, public.tickets,
  public.user_economy, public.user_levels_legacy, public.user_missions,
  public.warnings, public.allowed_domains
  FROM anon;

-- ============================================================
-- Storage: rank-banners — drop overly broad policies, keep ownership-scoped
-- ============================================================
DROP POLICY IF EXISTS "rank banners auth insert" ON storage.objects;
DROP POLICY IF EXISTS "rank banners auth update" ON storage.objects;
DROP POLICY IF EXISTS "rank banners auth delete" ON storage.objects;
DROP POLICY IF EXISTS "rank banners public read" ON storage.objects;
-- Keep: "rank-banners insert/update/delete" (ownership scoped) and "rank-banners read" (public).

-- ============================================================
-- get_public_stats: only anon needs to call it from the home page.
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.get_public_stats() FROM authenticated;
