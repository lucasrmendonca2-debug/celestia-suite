/**
 * Server functions para gerenciar Temporadas de XP.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const guildIdSchema = z.string().regex(/^\d{5,32}$/, "guild id inválido");

async function admin() {
  const { supabaseAdmin } = await import("@/lib/supabase-admin.server");
  return supabaseAdmin;
}
async function perm(guildId: string) {
  const { assertCanManageGuild } = await import("./permissions.server");
  return assertCanManageGuild(guildId);
}

export const listSeasons = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => z.object({ guildId: guildIdSchema }).parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("level_seasons")
      .select("*")
      .eq("guild_id", data.guildId)
      .order("starts_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const CreateInput = z.object({
  guildId: guildIdSchema,
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional().nullable(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  xp_multiplier: z.number().min(0.1).max(10).default(1),
  activate: z.boolean().default(true),
});

export const createSeason = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    if (data.activate) {
      // Desativa as anteriores
      await sb.from("level_seasons").update({ is_active: false }).eq("guild_id", data.guildId);
    }
    const { error } = await sb.from("level_seasons").insert({
      guild_id: data.guildId,
      name: data.name,
      description: data.description ?? null,
      starts_at: data.starts_at ?? new Date().toISOString(),
      ends_at: data.ends_at ?? null,
      xp_multiplier: data.xp_multiplier,
      is_active: data.activate,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setSeasonActive = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ guildId: guildIdSchema, id: z.string().uuid(), active: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    if (data.active) {
      await sb.from("level_seasons").update({ is_active: false }).eq("guild_id", data.guildId);
    }
    const { error } = await sb
      .from("level_seasons")
      .update({ is_active: data.active })
      .eq("id", data.id)
      .eq("guild_id", data.guildId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const endSeason = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ guildId: guildIdSchema, id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb
      .from("level_seasons")
      .update({ is_active: false, ends_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("guild_id", data.guildId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSeason = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ guildId: guildIdSchema, id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb
      .from("level_seasons")
      .delete()
      .eq("id", data.id)
      .eq("guild_id", data.guildId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getSeasonLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string; seasonId: string }) =>
    z.object({ guildId: guildIdSchema, seasonId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("level_season_users")
      .select("user_id,xp,level,messages_count,updated_at")
      .eq("season_id", data.seasonId)
      .order("xp", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
