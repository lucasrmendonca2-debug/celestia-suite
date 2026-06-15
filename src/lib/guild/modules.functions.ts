/**
 * Server functions de todos os módulos do bot (logs, autorole, automod,
 * leveling, economy, custom commands, embed templates, reaction roles,
 * mod cases, level rewards, shop).
 *
 * - Leitura: faz via service_role (sem expor admin client ao cliente).
 * - Escrita: exige sessão Discord com permissão de gerenciar a guild.
 * - Bot externo continua lendo via anon key (RLS pública de SELECT).
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

// ============================================================
// LOGS
// ============================================================
const LOGS_DEFAULTS = {
  log_channel_id: null as string | null,
  member_join: true,
  member_leave: true,
  member_ban: true,
  member_unban: true,
  member_kick: true,
  member_role_update: true,
  member_nickname_update: false,
  message_delete: true,
  message_edit: true,
  message_bulk_delete: true,
  channel_create: false,
  channel_delete: false,
  channel_update: false,
  role_create: false,
  role_delete: false,
  role_update: false,
  voice_state_update: false,
};

export const getLogsConfig = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: row, error } = await sb
      .from("guild_logs_config")
      .select("*")
      .eq("guild_id", data.guildId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? { guild_id: data.guildId, ...LOGS_DEFAULTS };
  });

const LogsInput = z.object({
  guildId: guildIdSchema,
  log_channel_id: snowflakeNullable,
  member_join: z.boolean(),
  member_leave: z.boolean(),
  member_ban: z.boolean(),
  member_unban: z.boolean(),
  member_kick: z.boolean(),
  member_role_update: z.boolean(),
  member_nickname_update: z.boolean(),
  message_delete: z.boolean(),
  message_edit: z.boolean(),
  message_bulk_delete: z.boolean(),
  channel_create: z.boolean(),
  channel_delete: z.boolean(),
  channel_update: z.boolean(),
  role_create: z.boolean(),
  role_delete: z.boolean(),
  role_update: z.boolean(),
  voice_state_update: z.boolean(),
});

export const updateLogsConfig = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => LogsInput.parse(d))
  .handler(async ({ data }) => {
    const userId = await perm(data.guildId);
    const sb = await admin();
    const { guildId, ...rest } = data as Record<string, unknown> & {
      guildId: string;
    };
    const payload = { guild_id: guildId, updated_by: userId, ...rest };
    const { data: row, error } = await sb
      .from("guild_logs_config")
      .upsert(payload, { onConflict: "guild_id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ============================================================
// AUTOROLE
// ============================================================
export const listAutoroles = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("guild_autoroles")
      .select("*")
      .eq("guild_id", data.guildId)
      .order("created_at");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const addAutorole = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        guildId: guildIdSchema,
        roleId: snowflake,
        target: z.enum(["member", "bot"]).default("member"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb.from("guild_autoroles").insert({
      guild_id: data.guildId,
      role_id: data.roleId,
      target: data.target,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeAutorole = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ guildId: guildIdSchema, id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb
      .from("guild_autoroles")
      .delete()
      .eq("id", data.id)
      .eq("guild_id", data.guildId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// REACTION ROLES
// ============================================================
export const listReactionRoles = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("reaction_roles")
      .select("*")
      .eq("guild_id", data.guildId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const RRInput = z.object({
  guildId: guildIdSchema,
  channel_id: snowflake,
  message_id: snowflake,
  emoji: z.string().min(1).max(64),
  role_id: snowflake,
  mode: z.enum(["toggle", "add", "remove", "unique"]).default("toggle"),
  group_key: z.string().max(64).nullable().optional(),
});

export const addReactionRole = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RRInput.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb.from("reaction_roles").insert({
      guild_id: data.guildId,
      channel_id: data.channel_id,
      message_id: data.message_id,
      emoji: data.emoji,
      role_id: data.role_id,
      mode: data.mode,
      group_key: data.group_key ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeReactionRole = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ guildId: guildIdSchema, id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb
      .from("reaction_roles")
      .delete()
      .eq("id", data.id)
      .eq("guild_id", data.guildId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// AUTOMOD
// ============================================================
const AUTOMOD_DEFAULTS = {
  anti_spam_enabled: false,
  anti_spam_threshold: 5,
  anti_spam_interval: 5,
  anti_invite_enabled: false,
  anti_link_enabled: false,
  anti_caps_enabled: false,
  anti_caps_threshold: 70,
  anti_mention_enabled: false,
  anti_mention_threshold: 5,
  blacklist_words: [] as string[],
  whitelist_channels: [] as string[],
  whitelist_roles: [] as string[],
  punishment: "delete" as "delete" | "warn" | "mute" | "kick" | "ban",
};

export const getAutomodConfig = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: row, error } = await sb
      .from("automod_config")
      .select("*")
      .eq("guild_id", data.guildId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? { guild_id: data.guildId, ...AUTOMOD_DEFAULTS };
  });

const AutomodInput = z.object({
  guildId: guildIdSchema,
  anti_spam_enabled: z.boolean(),
  anti_spam_threshold: z.number().int().min(2).max(50),
  anti_spam_interval: z.number().int().min(1).max(60),
  anti_invite_enabled: z.boolean(),
  anti_link_enabled: z.boolean(),
  anti_caps_enabled: z.boolean(),
  anti_caps_threshold: z.number().int().min(10).max(100),
  anti_mention_enabled: z.boolean(),
  anti_mention_threshold: z.number().int().min(2).max(50),
  blacklist_words: z.array(z.string().min(1).max(64)).max(200),
  whitelist_channels: z.array(snowflake).max(100),
  whitelist_roles: z.array(snowflake).max(100),
  punishment: z.enum(["delete", "warn", "mute", "kick", "ban"]),
});

export const updateAutomodConfig = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AutomodInput.parse(d))
  .handler(async ({ data }) => {
    const userId = await perm(data.guildId);
    const sb = await admin();
    const { guildId, ...rest } = data;
    const { data: row, error } = await sb
      .from("automod_config")
      .upsert(
        { guild_id: guildId, updated_by: userId, ...rest },
        { onConflict: "guild_id" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ============================================================
// LEVELING
// ============================================================
const LEVELING_DEFAULTS = {
  enabled: false,
  xp_per_message_min: 15,
  xp_per_message_max: 25,
  cooldown_seconds: 60,
  level_up_channel_id: null as string | null,
  level_up_message: "🎉 GG {user}, você subiu para o nível **{level}**!",
  level_up_dm: false,
  no_xp_channels: [] as string[],
  no_xp_roles: [] as string[],
  stack_rewards: false,
};

export const getLevelingConfig = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: row, error } = await sb
      .from("leveling_config")
      .select("*")
      .eq("guild_id", data.guildId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? { guild_id: data.guildId, ...LEVELING_DEFAULTS };
  });

const LevelingInput = z.object({
  guildId: guildIdSchema,
  enabled: z.boolean(),
  xp_per_message_min: z.number().int().min(1).max(500),
  xp_per_message_max: z.number().int().min(1).max(500),
  cooldown_seconds: z.number().int().min(0).max(3600),
  level_up_channel_id: snowflakeNullable,
  level_up_message: z.string().min(1).max(2000),
  level_up_dm: z.boolean(),
  no_xp_channels: z.array(snowflake).max(100),
  no_xp_roles: z.array(snowflake).max(100),
  stack_rewards: z.boolean(),
});

export const updateLevelingConfig = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => LevelingInput.parse(d))
  .handler(async ({ data }) => {
    const userId = await perm(data.guildId);
    const sb = await admin();
    const { guildId, ...rest } = data;
    const { data: row, error } = await sb
      .from("leveling_config")
      .upsert(
        { guild_id: guildId, updated_by: userId, ...rest },
        { onConflict: "guild_id" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listLevelRewards = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("level_rewards")
      .select("*")
      .eq("guild_id", data.guildId)
      .order("level");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const addLevelReward = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        guildId: guildIdSchema,
        level: z.number().int().min(1).max(1000),
        roleId: snowflake,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb.from("level_rewards").insert({
      guild_id: data.guildId,
      level: data.level,
      role_id: data.roleId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeLevelReward = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ guildId: guildIdSchema, id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb
      .from("level_rewards")
      .delete()
      .eq("id", data.id)
      .eq("guild_id", data.guildId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("user_levels")
      .select("*")
      .eq("guild_id", data.guildId)
      .order("xp", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ============================================================
// ECONOMY
// ============================================================
const ECONOMY_DEFAULTS = {
  enabled: false,
  currency_name: "moedas",
  currency_emoji: "💰",
  daily_amount: 100,
  work_min: 50,
  work_max: 200,
  work_cooldown_seconds: 3600,
};

export const getEconomyConfig = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: row, error } = await sb
      .from("economy_config")
      .select("*")
      .eq("guild_id", data.guildId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? { guild_id: data.guildId, ...ECONOMY_DEFAULTS };
  });

const EconomyInput = z.object({
  guildId: guildIdSchema,
  enabled: z.boolean(),
  currency_name: z.string().min(1).max(32),
  currency_emoji: z.string().min(1).max(16),
  daily_amount: z.number().int().min(0).max(1_000_000),
  work_min: z.number().int().min(0).max(1_000_000),
  work_max: z.number().int().min(0).max(1_000_000),
  work_cooldown_seconds: z.number().int().min(0).max(86400),
});

export const updateEconomyConfig = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => EconomyInput.parse(d))
  .handler(async ({ data }) => {
    const userId = await perm(data.guildId);
    const sb = await admin();
    const { guildId, ...rest } = data;
    const { data: row, error } = await sb
      .from("economy_config")
      .upsert(
        { guild_id: guildId, updated_by: userId, ...rest },
        { onConflict: "guild_id" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listShopItems = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("shop_items")
      .select("*")
      .eq("guild_id", data.guildId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const ShopItemInput = z.object({
  guildId: guildIdSchema,
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(64),
  description: z.string().max(512).nullable().optional(),
  price: z.number().int().min(0).max(1_000_000_000),
  type: z.enum(["role", "custom"]).default("role"),
  role_id: snowflakeNullable.optional(),
  stock: z.number().int().min(0).max(1_000_000).nullable().optional(),
  enabled: z.boolean().default(true),
});

export const upsertShopItem = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ShopItemInput.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const payload = {
      id: data.id,
      guild_id: data.guildId,
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      type: data.type,
      role_id: data.role_id ?? null,
      stock: data.stock ?? null,
      enabled: data.enabled,
    };
    const { error } = await sb
      .from("shop_items")
      .upsert(payload, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeShopItem = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ guildId: guildIdSchema, id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb
      .from("shop_items")
      .delete()
      .eq("id", data.id)
      .eq("guild_id", data.guildId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// MOD CASES (read-only no dashboard)
// ============================================================
export const listModCases = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string; userId?: string }) =>
    z
      .object({
        guildId: guildIdSchema,
        userId: snowflake.optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    let q = sb
      .from("mod_cases")
      .select("*")
      .eq("guild_id", data.guildId)
      .order("case_number", { ascending: false })
      .limit(100);
    if (data.userId) q = q.eq("user_id", data.userId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ============================================================
// CUSTOM COMMANDS
// ============================================================
export const listCustomCommands = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("custom_commands")
      .select("*")
      .eq("guild_id", data.guildId)
      .order("name");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const CCInput = z.object({
  guildId: guildIdSchema,
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[a-z0-9_-]+$/, "use letras minúsculas, números, _ ou -"),
  description: z.string().max(200).default(""),
  response_text: z.string().max(2000).nullable().optional(),
  embed: z.any().nullable().optional(),
  required_roles: z.array(snowflake).max(50).default([]),
  enabled: z.boolean().default(true),
});

export const upsertCustomCommand = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CCInput.parse(d))
  .handler(async ({ data }) => {
    const userId = await perm(data.guildId);
    const sb = await admin();
    const payload = {
      id: data.id,
      guild_id: data.guildId,
      name: data.name,
      description: data.description,
      response_text: data.response_text ?? null,
      embed: data.embed ?? null,
      required_roles: data.required_roles,
      enabled: data.enabled,
      created_by: userId,
    };
    const { error } = await sb
      .from("custom_commands")
      .upsert(payload, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeCustomCommand = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ guildId: guildIdSchema, id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb
      .from("custom_commands")
      .delete()
      .eq("id", data.id)
      .eq("guild_id", data.guildId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// EMBED TEMPLATES
// ============================================================
export const listEmbedTemplates = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("embed_templates")
      .select("*")
      .eq("guild_id", data.guildId)
      .order("name");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const EmbedInput = z.object({
  guildId: guildIdSchema,
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(64),
  embed: z.any(),
});

export const upsertEmbedTemplate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => EmbedInput.parse(d))
  .handler(async ({ data }) => {
    const userId = await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb.from("embed_templates").upsert(
      {
        id: data.id,
        guild_id: data.guildId,
        name: data.name,
        embed: data.embed,
        created_by: userId,
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeEmbedTemplate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ guildId: guildIdSchema, id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb
      .from("embed_templates")
      .delete()
      .eq("id", data.id)
      .eq("guild_id", data.guildId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
