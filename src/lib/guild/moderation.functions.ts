/**
 * Sistema de Moderação — server functions.
 *
 * Padrão: leitura/escrita via service_role no servidor, gating via
 * assertCanManageGuild. Mesmo padrão de tickets.functions.ts.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const guildIdSchema = z.string().regex(/^\d{5,32}$/, "guild id inválido");
const snowflakeNullable = z
  .string()
  .regex(/^\d{5,32}$/, "id inválido")
  .nullable();
const snowflake = z.string().regex(/^\d{5,32}$/, "id inválido");

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
async function perm(guildId: string) {
  const { assertCanManageGuild } = await import("./permissions.server");
  return assertCanManageGuild(guildId);
}

const MOD_DEFAULTS = {
  enabled: false,
  log_channel_id: null as string | null,
  mute_role_id: null as string | null,
  max_warnings: 3,
  default_warn_punishment: "none" as
    | "none"
    | "mute"
    | "kick"
    | "ban"
    | "temp_mute"
    | "temp_ban",
  default_warn_punishment_duration: 3600,
  default_mute_duration: 600,
  allow_temporary_ban: true,
  allow_temporary_mute: true,
  delete_punished_messages: false,
  dm_punished_user: true,
  punishment_dm_template:
    "Você recebeu **{action}** em **{guild}**.\n\n**Motivo:** {reason}\n**Duração:** {duration}",
  protected_role_ids: [] as string[],
  protected_user_ids: [] as string[],
  embed_color: 15548997,
  embed_footer: "Sistema de Moderação",
  embed_icon_url: null as string | null,
  enabled_log_events: [
    "ban",
    "unban",
    "kick",
    "mute",
    "unmute",
    "warn",
    "removewarn",
    "clear",
    "lock",
    "unlock",
    "slowmode",
    "automod",
    "config_change",
  ] as string[],
};

export const getModerationConfig = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: row, error } = await sb
      .from("moderation_configs")
      .select("*")
      .eq("guild_id", data.guildId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? { guild_id: data.guildId, ...MOD_DEFAULTS };
  });

const ConfigInput = z.object({
  guildId: guildIdSchema,
  enabled: z.boolean(),
  log_channel_id: snowflakeNullable,
  mute_role_id: snowflakeNullable,
  max_warnings: z.number().int().min(1).max(50),
  default_warn_punishment: z.enum([
    "none",
    "mute",
    "kick",
    "ban",
    "temp_mute",
    "temp_ban",
  ]),
  default_warn_punishment_duration: z.number().int().min(60).max(60 * 60 * 24 * 30),
  default_mute_duration: z.number().int().min(60).max(60 * 60 * 24 * 28),
  allow_temporary_ban: z.boolean(),
  allow_temporary_mute: z.boolean(),
  delete_punished_messages: z.boolean(),
  dm_punished_user: z.boolean(),
  punishment_dm_template: z.string().min(1).max(2000),
  protected_role_ids: z.array(snowflake).max(50),
  protected_user_ids: z.array(snowflake).max(50),
  embed_color: z.number().int().min(0).max(0xffffff),
  embed_footer: z.string().min(1).max(200),
  embed_icon_url: z.string().url().max(1000).nullable(),
  enabled_log_events: z.array(z.string().min(1).max(40)).max(40),
});

export const updateModerationConfig = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ConfigInput.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { guildId, ...rest } = data;
    const { data: row, error } = await sb
      .from("moderation_configs")
      .upsert({ guild_id: guildId, ...rest }, { onConflict: "guild_id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/* ---------------- Permissões por cargo ---------------- */

export const listModerationPermissionRoles = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("moderation_permission_roles")
      .select("*")
      .eq("guild_id", data.guildId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const PermRoleInput = z.object({
  guildId: guildIdSchema,
  role_id: snowflake,
  can_use_moderation: z.boolean().optional(),
  can_ban: z.boolean().optional(),
  can_unban: z.boolean().optional(),
  can_kick: z.boolean().optional(),
  can_mute: z.boolean().optional(),
  can_unmute: z.boolean().optional(),
  can_warn: z.boolean().optional(),
  can_remove_warn: z.boolean().optional(),
  can_clear_messages: z.boolean().optional(),
  can_lock_channel: z.boolean().optional(),
  can_unlock_channel: z.boolean().optional(),
  can_manage_automod: z.boolean().optional(),
  can_view_history: z.boolean().optional(),
  can_view_logs: z.boolean().optional(),
  can_manage_blacklist: z.boolean().optional(),
  can_manage_moderation_config: z.boolean().optional(),
});

export const upsertModerationPermissionRole = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PermRoleInput.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { guildId, role_id, ...rest } = data;
    const { data: row, error } = await sb
      .from("moderation_permission_roles")
      .upsert(
        { guild_id: guildId, role_id, ...rest },
        { onConflict: "guild_id,role_id" },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteModerationPermissionRole = createServerFn({ method: "POST" })
  .inputValidator((d: { guildId: string; role_id: string }) =>
    z.object({ guildId: guildIdSchema, role_id: snowflake }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb
      .from("moderation_permission_roles")
      .delete()
      .eq("guild_id", data.guildId)
      .eq("role_id", data.role_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- Punições / histórico ---------------- */

export const listPunishments = createServerFn({ method: "GET" })
  .inputValidator(
    (d: {
      guildId: string;
      userId?: string | null;
      moderatorId?: string | null;
      type?: string | null;
      status?: "all" | "active" | "inactive";
      limit?: number;
    }) =>
      z
        .object({
          guildId: guildIdSchema,
          userId: snowflakeNullable.optional(),
          moderatorId: snowflakeNullable.optional(),
          type: z.string().max(40).nullable().optional(),
          status: z.enum(["all", "active", "inactive"]).optional(),
          limit: z.number().int().min(1).max(500).optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    let q = sb
      .from("punishments")
      .select("*")
      .eq("guild_id", data.guildId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.userId) q = q.eq("user_id", data.userId);
    if (data.moderatorId) q = q.eq("moderator_id", data.moderatorId);
    if (data.type) q = q.eq("type", data.type);
    if (data.status === "active") q = q.eq("active", true);
    if (data.status === "inactive") q = q.eq("active", false);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getModerationStats = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const [totalRes, activeRes, warnRes] = await Promise.all([
      sb
        .from("punishments")
        .select("id", { count: "exact", head: true })
        .eq("guild_id", data.guildId),
      sb
        .from("punishments")
        .select("id", { count: "exact", head: true })
        .eq("guild_id", data.guildId)
        .eq("active", true),
      sb
        .from("warnings")
        .select("id", { count: "exact", head: true })
        .eq("guild_id", data.guildId)
        .eq("active", true),
    ]);
    return {
      total: totalRes.count ?? 0,
      active: activeRes.count ?? 0,
      activeWarnings: warnRes.count ?? 0,
    };
  });
