/**
 * Server functions de Badges & Achievements (Pass 2).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const guildIdSchema = z.string().regex(/^\d{5,32}$/, "guild id inválido");
const snowflake = z.string().regex(/^\d{5,32}$/, "id inválido");
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "cor inválida");

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
async function perm(guildId: string) {
  const { assertCanManageGuild } = await import("./permissions.server");
  return assertCanManageGuild(guildId);
}

// ============================================================
// BADGES
// ============================================================
export const listBadges = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => z.object({ guildId: guildIdSchema }).parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb.from("badges").select("*").eq("guild_id", data.guildId).order("created_at");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const BadgeInput = z.object({
  guildId: guildIdSchema,
  id: z.string().uuid().optional(),
  code: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/i, "use letras, números, _ ou -"),
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(""),
  emoji: z.string().min(1).max(8).default("🏅"),
  icon_url: z.string().url().nullable().optional(),
  rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary", "mythic"]),
  color: hexColor,
  hidden: z.boolean().default(false),
});

export const upsertBadge = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => BadgeInput.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { guildId, id, ...rest } = data;
    if (id) {
      const { error } = await sb.from("badges").update(rest).eq("id", id).eq("guild_id", guildId);
      if (error) throw new Error(error.message);
    } else {
      const { enforceGuildLimit } = await import("./premium-limits.server");
      await enforceGuildLimit(guildId, "badges.custom", "badges");
      const { error } = await sb.from("badges").insert({ guild_id: guildId, ...rest });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteBadge = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ guildId: guildIdSchema, id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb.from("badges").delete().eq("id", data.id).eq("guild_id", data.guildId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const grantBadge = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        guildId: guildIdSchema,
        userId: snowflake,
        badgeId: z.string().uuid(),
        reason: z.string().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    // upsert manual (idempotente)
    const { data: existing } = await sb
      .from("user_badges")
      .select("id")
      .eq("guild_id", data.guildId)
      .eq("user_id", data.userId)
      .eq("badge_id", data.badgeId)
      .maybeSingle();
    if (!existing) {
      const { error } = await sb.from("user_badges").insert({
        guild_id: data.guildId,
        user_id: data.userId,
        badge_id: data.badgeId,
        awarded_by: "dashboard",
        reason: data.reason ?? null,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true, alreadyHad: !!existing };
  });

export const revokeBadgeFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({ guildId: guildIdSchema, userId: snowflake, badgeId: z.string().uuid() })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb
      .from("user_badges")
      .delete()
      .eq("guild_id", data.guildId)
      .eq("user_id", data.userId)
      .eq("badge_id", data.badgeId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// ACHIEVEMENTS
// ============================================================
export const listAchievements = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => z.object({ guildId: guildIdSchema }).parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("achievements")
      .select("*")
      .eq("guild_id", data.guildId)
      .order("trigger_type")
      .order("trigger_value");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const AchievementInput = z.object({
  guildId: guildIdSchema,
  id: z.string().uuid().optional(),
  code: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/i),
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(""),
  emoji: z.string().min(1).max(8).default("🏆"),
  points: z.number().int().min(0).max(10_000),
  trigger_type: z.enum([
    "manual",
    "messages_count",
    "level_reached",
    "reputation_received",
    "badges_collected",
  ]),
  trigger_value: z.number().int().min(0).max(1_000_000),
  reward_badge_id: z.string().uuid().nullable().optional(),
  reward_coins: z.number().int().min(0).max(1_000_000),
  reward_xp: z.number().int().min(0).max(1_000_000),
  hidden: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const upsertAchievement = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AchievementInput.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { guildId, id, ...rest } = data;
    if (id) {
      const { error } = await sb.from("achievements").update(rest).eq("id", id).eq("guild_id", guildId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await sb.from("achievements").insert({ guild_id: guildId, ...rest });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteAchievement = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ guildId: guildIdSchema, id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb
      .from("achievements")
      .delete()
      .eq("id", data.id)
      .eq("guild_id", data.guildId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
