/**
 * Server functions do Sistema Social (level, perfil, reputação, recompensas).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const guildIdSchema = z.string().regex(/^\d{5,32}$/, "guild id inválido");
const snowflake = z.string().regex(/^\d{5,32}$/, "id inválido");
const snowflakeNullable = z.string().regex(/^\d{5,32}$/, "id inválido").nullable();
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "cor inválida (#RRGGBB)");

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
async function perm(guildId: string) {
  const { assertCanManageGuild } = await import("./permissions.server");
  return assertCanManageGuild(guildId);
}

// ============================================================
// SOCIAL CONFIG (Geral)
// ============================================================
const SOCIAL_DEFAULTS = {
  enabled: true,
  level_enabled: true,
  profile_enabled: true,
  reputation_enabled: true,
  achievements_enabled: true,
  log_channel_id: null as string | null,
  ignored_channel_ids: [] as string[],
  ignored_role_ids: [] as string[],
  embed_color: "#5865F2",
  card_accent_color: "#5865F2",
  card_background_color: "#0f1117",
  card_text_color: "#ffffff",
  card_style: "default" as "default" | "minimal" | "gradient",
};

export const getSocialConfig = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => z.object({ guildId: guildIdSchema }).parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: row, error } = await sb
      .from("social_config")
      .select("*")
      .eq("guild_id", data.guildId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? { guild_id: data.guildId, ...SOCIAL_DEFAULTS };
  });

const SocialInput = z.object({
  guildId: guildIdSchema,
  enabled: z.boolean(),
  level_enabled: z.boolean(),
  profile_enabled: z.boolean(),
  reputation_enabled: z.boolean(),
  achievements_enabled: z.boolean(),
  log_channel_id: snowflakeNullable,
  ignored_channel_ids: z.array(snowflake).max(100),
  ignored_role_ids: z.array(snowflake).max(100),
  embed_color: hexColor,
  card_accent_color: hexColor.default("#5865F2"),
  card_background_color: hexColor.default("#0f1117"),
  card_text_color: hexColor.default("#ffffff"),
  card_style: z.enum(["default", "minimal", "gradient"]).default("default"),
});

export const updateSocialConfig = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SocialInput.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { guildId, ...rest } = data;
    const { error } = await sb
      .from("social_config")
      .upsert({ guild_id: guildId, ...rest }, { onConflict: "guild_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// LEVEL CONFIG (XP & Level)
// ============================================================
const LEVEL_DEFAULTS = {
  enabled: true,
  min_xp_per_message: 15,
  max_xp_per_message: 25,
  cooldown_seconds: 60,
  global_multiplier: 1.0,
  vip_multiplier: 2.0,
  level_up_channel_id: null as string | null,
  level_up_message:
    "Boa! {user} avançou para o nível {level}. Continue participando para desbloquear novas recompensas.",
  send_level_up_message: true,
  level_up_message_mode: "current_channel" as "current_channel" | "fixed_channel" | "dm" | "disabled",
  delete_level_up_after_seconds: 0,
  min_message_length: 3,
};

export const getLevelConfig = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => z.object({ guildId: guildIdSchema }).parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: row, error } = await sb
      .from("level_config")
      .select("*")
      .eq("guild_id", data.guildId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? { guild_id: data.guildId, ...LEVEL_DEFAULTS };
  });

const LevelInput = z.object({
  guildId: guildIdSchema,
  enabled: z.boolean(),
  min_xp_per_message: z.number().int().min(1).max(500),
  max_xp_per_message: z.number().int().min(1).max(500),
  cooldown_seconds: z.number().int().min(0).max(3600),
  global_multiplier: z.number().min(0.1).max(10),
  vip_multiplier: z.number().min(0.1).max(10),
  level_up_channel_id: snowflakeNullable,
  level_up_message: z.string().min(1).max(2000),
  send_level_up_message: z.boolean(),
  level_up_message_mode: z.enum(["current_channel", "fixed_channel", "dm", "disabled"]),
  delete_level_up_after_seconds: z.number().int().min(0).max(600),
  min_message_length: z.number().int().min(0).max(500),
});

export const updateLevelConfig = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => LevelInput.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { guildId, ...rest } = data;
    const { error } = await sb
      .from("level_config")
      .upsert({ guild_id: guildId, ...rest }, { onConflict: "guild_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// LEVEL REWARDS
// ============================================================
export const listSocialRewards = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => z.object({ guildId: guildIdSchema }).parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("level_rewards")
      .select("*")
      .eq("guild_id", data.guildId)
      .order("level", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const RewardInput = z.object({
  guildId: guildIdSchema,
  level: z.number().int().min(1).max(1000),
  reward_type: z.enum(["role", "coins", "badge", "title"]),
  reward_value: z.string().min(1).max(200),
  remove_previous_roles: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const addSocialReward = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RewardInput.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { guildId, ...rest } = data;
    const { enforceGuildLimit } = await import("./premium-limits.server");
    await enforceGuildLimit(guildId, "level.rewards", "level_rewards");
    const { error } = await sb.from("level_rewards").insert({ guild_id: guildId, ...rest });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeSocialReward = createServerFn({ method: "POST" })
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

// ============================================================
// LEADERBOARD
// ============================================================
export const getSocialLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => z.object({ guildId: guildIdSchema }).parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("level_users")
      .select("user_id, username, xp, level, total_xp, messages_count")
      .eq("guild_id", data.guildId)
      .order("total_xp", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getSocialLogs = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => z.object({ guildId: guildIdSchema }).parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("level_logs")
      .select("*")
      .eq("guild_id", data.guildId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ============================================================
// MY PROFILE (overrides individuais do membro logado)
// ============================================================
const hexColorNullable = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "cor inválida (#RRGGBB)")
  .nullable();

async function currentUserId(): Promise<string> {
  const { getSession } = await import("../auth/session.server");
  const session = await getSession();
  if (!session.data.userId) throw new Error("Não autenticado.");
  return session.data.userId;
}

export const getMyProfile = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => z.object({ guildId: guildIdSchema }).parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const userId = await currentUserId();
    const sb = await admin();
    const { data: row, error } = await sb
      .from("social_profiles")
      .select("accent_color, background_color, text_color, card_style")
      .eq("guild_id", data.guildId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (
      row ?? {
        accent_color: null as string | null,
        background_color: null as string | null,
        text_color: null as string | null,
        card_style: "default" as string,
      }
    );
  });

const MyProfileInput = z.object({
  guildId: guildIdSchema,
  accent_color: hexColorNullable,
  background_color: hexColorNullable,
  text_color: hexColorNullable,
  card_style: z.enum(["default", "minimal", "gradient"]),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => MyProfileInput.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const userId = await currentUserId();
    const sb = await admin();
    const { guildId, ...rest } = data;
    const { error } = await sb
      .from("social_profiles")
      .upsert(
        { guild_id: guildId, user_id: userId, ...rest },
        { onConflict: "guild_id,user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
