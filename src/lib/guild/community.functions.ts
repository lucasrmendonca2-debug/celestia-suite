/**
 * Server functions do sistema de Comunidade
 * (configuração, listagens de enquetes e sugestões).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const guildIdSchema = z.string().regex(/^\d{5,32}$/, "guild id inválido");
const channelIdSchema = z.string().regex(/^\d{5,32}$/).nullable();

async function admin() {
  const { supabaseAdmin } = await import("@/lib/supabase-admin.server");
  return supabaseAdmin;
}

async function perm(guildId: string) {
  const { assertCanManageGuild } = await import("./permissions.server");
  return assertCanManageGuild(guildId);
}

const DEFAULT_CONFIG = {
  polls_enabled: true,
  polls_log_channel_id: null,
  polls_max_options: 10,
  polls_allow_anonymous: false,
  suggestions_enabled: true,
  suggestions_channel_id: null,
  suggestions_log_channel_id: null,
  suggestions_require_reason: false,
  suggestions_allow_anonymous: false,
  suggestions_allow_voting: true,
};

export const getCommunityConfig = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => z.object({ guildId: guildIdSchema }).parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: row } = await sb
      .from("community_config")
      .select("*")
      .eq("guild_id", data.guildId)
      .maybeSingle();
    return row ?? { guild_id: data.guildId, ...DEFAULT_CONFIG };
  });

const updateSchema = z.object({
  guildId: guildIdSchema,
  polls_enabled: z.boolean().optional(),
  polls_log_channel_id: channelIdSchema.optional(),
  polls_max_options: z.number().int().min(2).max(20).optional(),
  polls_allow_anonymous: z.boolean().optional(),
  suggestions_enabled: z.boolean().optional(),
  suggestions_channel_id: channelIdSchema.optional(),
  suggestions_log_channel_id: channelIdSchema.optional(),
  suggestions_require_reason: z.boolean().optional(),
  suggestions_allow_anonymous: z.boolean().optional(),
  suggestions_allow_voting: z.boolean().optional(),
});

export const updateCommunityConfig = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { guildId, ...patch } = data;
    const { data: row, error } = await sb
      .from("community_config")
      .upsert({ guild_id: guildId, ...patch }, { onConflict: "guild_id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listGuildPolls = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => z.object({ guildId: guildIdSchema }).parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows } = await sb
      .from("polls")
      .select("id, question, status, options, ends_at, created_by, channel_id, created_at")
      .eq("guild_id", data.guildId)
      .order("created_at", { ascending: false })
      .limit(50);
    return rows ?? [];
  });

export const listGuildSuggestions = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string; status?: string }) =>
    z
      .object({
        guildId: guildIdSchema,
        status: z.enum(["PENDING", "APPROVED", "REJECTED", "IMPLEMENTED", "REVIEW", "ALL"]).default("ALL"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    let q = sb
      .from("suggestions")
      .select("id, content, status, upvotes, downvotes, author_id, decided_by, decision_reason, created_at")
      .eq("guild_id", data.guildId);
    if (data.status !== "ALL") q = q.eq("status", data.status);
    const { data: rows } = await q.order("created_at", { ascending: false }).limit(50);
    return rows ?? [];
  });

export const updateSuggestionStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        guildId: guildIdSchema,
        suggestionId: z.string().uuid(),
        status: z.enum(["PENDING", "APPROVED", "REJECTED", "IMPLEMENTED", "REVIEW"]),
        reason: z.string().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const userId = await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb
      .from("suggestions")
      .update({
        status: data.status,
        decided_by: userId,
        decision_reason: data.reason ?? null,
      })
      .eq("id", data.suggestionId)
      .eq("guild_id", data.guildId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelPoll = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ guildId: guildIdSchema, pollId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb
      .from("polls")
      .update({ status: "CANCELED" })
      .eq("id", data.pollId)
      .eq("guild_id", data.guildId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
