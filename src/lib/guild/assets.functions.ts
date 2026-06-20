/**
 * Server fns para gerenciar bot_assets (imagens, GIFs, ícones por key).
 * Escreve via service_role após checar permissão de manager + assertCanAccessArea.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface BotAssetRow {
  id: string;
  guild_id: string | null;
  key: string;
  name: string;
  type: string;
  module: string;
  url: string;
  active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const ListInput = z.object({ guildId: z.string().regex(/^\d{5,32}$/) });

export const listGuildAssets = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => ListInput.parse(d))
  .handler(async ({ data }): Promise<BotAssetRow[]> => {
    const { getActorAndAssertManager } = await import("./permissions-audit.server");
    await getActorAndAssertManager(data.guildId);
    const { supabaseAdmin } = await import("@/lib/supabase-admin.server");
    const { data: rows, error } = await supabaseAdmin
      .from("bot_assets")
      .select("*")
      .or(`guild_id.eq.${data.guildId},guild_id.is.null`)
      .order("module", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as BotAssetRow[];
  });

const UpsertInput = z.object({
  guildId: z.string().regex(/^\d{5,32}$/),
  key: z.string().min(3).max(80).regex(/^[a-z0-9_.-]+$/),
  name: z.string().min(1).max(80),
  type: z.enum(["IMAGE", "GIF", "ICON", "BANNER", "THUMBNAIL", "BADGE", "EMOJI", "BACKGROUND"]),
  module: z.enum([
    "GLOBAL",
    "WELCOME",
    "TICKETS",
    "MODERATION",
    "ECONOMY",
    "SOCIAL",
    "LEVEL",
    "PREMIUM",
    "FUN",
    "LOGS",
    "DASHBOARD",
  ]),
  url: z.string().url().max(1000),
  active: z.boolean().optional(),
});

export const upsertGuildAsset = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UpsertInput.parse(d))
  .handler(async ({ data }) => {
    const { assertCanAccessArea, writeAudit } = await import("./permissions-audit.server");
    const actor = await assertCanAccessArea(data.guildId, "permissions");
    const { supabaseAdmin } = await import("@/lib/supabase-admin.server");

    const { data: prev } = await supabaseAdmin
      .from("bot_assets")
      .select("url, active")
      .eq("guild_id", data.guildId)
      .eq("key", data.key)
      .maybeSingle();

    const { data: row, error } = await supabaseAdmin
      .from("bot_assets")
      .upsert(
        {
          guild_id: data.guildId,
          key: data.key,
          name: data.name,
          type: data.type,
          module: data.module,
          url: data.url,
          active: data.active ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "guild_id,key" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await writeAudit({
      guildId: data.guildId,
      event: "assets.upsert",
      actor,
      target_id: data.key,
      before: prev ?? null,
      after: { url: data.url, active: data.active ?? true },
    });
    return row as BotAssetRow;
  });

const RemoveInput = z.object({
  guildId: z.string().regex(/^\d{5,32}$/),
  key: z.string().min(3).max(80),
});

export const removeGuildAsset = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RemoveInput.parse(d))
  .handler(async ({ data }) => {
    const { assertCanAccessArea, writeAudit } = await import("./permissions-audit.server");
    const actor = await assertCanAccessArea(data.guildId, "permissions");
    const { supabaseAdmin } = await import("@/lib/supabase-admin.server");
    const { error } = await supabaseAdmin
      .from("bot_assets")
      .delete()
      .eq("guild_id", data.guildId)
      .eq("key", data.key);
    if (error) throw new Error(error.message);
    await writeAudit({
      guildId: data.guildId,
      event: "assets.remove",
      actor,
      target_id: data.key,
      before: null,
      after: null,
    });
    return { ok: true };
  });
