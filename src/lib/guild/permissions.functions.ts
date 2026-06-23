/**
 * Permissões do dashboard por cargo + audit log.
 *
 * Modelo:
 *  - dashboard_permissions(guild_id, role_id, areas[])
 *  - server_audit_logs(category='dashboard', event, actor_id, target_id, before, after, metadata)
 *
 * Regras:
 *  - Donos / MANAGE_GUILD (filterManageableGuilds) sempre acessam tudo.
 *  - Se NÃO houver linhas pra guild → modo aberto (qualquer manager passa).
 *  - Se houver linhas → manager precisa ter PELO MENOS um cargo com 'all'
 *    ou com a área pedida.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const DASHBOARD_AREAS = [
  "overview",
  "welcome",
  "autorole",
  "logs",
  "tickets",
  "moderation",
  "automod",
  "economy",
  "leveling",
  "social",
  "community",
  "embeds",
  "commands",
  "reaction_roles",
  "assets",
  "badges",
  "settings",
  "permissions",
  "premium",
] as const;
export type DashboardArea = (typeof DASHBOARD_AREAS)[number];

export const AREA_LABELS: Record<DashboardArea, string> = {
  overview: "Visão geral",
  welcome: "Boas-vindas",
  autorole: "Autorole",
  logs: "Logs",
  tickets: "Tickets",
  moderation: "Moderação",
  automod: "Automod",
  economy: "Economia",
  leveling: "Níveis",
  social: "Social",
  community: "Comunidade",
  embeds: "Embeds",
  commands: "Comandos",
  reaction_roles: "Reaction roles",
  assets: "Assets / Imagens",
  badges: "Badges",
  settings: "Configurações gerais",
  permissions: "Permissões",
  premium: "Premium",
};

export interface DashboardPermissionRow {
  id: string;
  guild_id: string;
  role_id: string;
  areas: string[];
  updated_at: string;
}

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export interface AuditEntry {
  id: string;
  guild_id: string;
  event: string;
  actor_id: string | null;
  actor_tag: string | null;
  target_id: string | null;
  before: Json;
  after: Json;
  metadata: Json;
  created_at: string;
}

// helpers vivem em ./permissions-audit.server.ts (server-only, não vaza pro client)


const GuildInput = z.object({ guildId: z.string().regex(/^\d{5,32}$/) });

export const listDashboardPermissions = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => GuildInput.parse(d))
  .handler(async ({ data }): Promise<DashboardPermissionRow[]> => {
    const { getActorAndAssertManager } = await import("./permissions-audit.server");
    await getActorAndAssertManager(data.guildId);
    const { supabaseAdmin } = await import("@/lib/supabase-admin.server");
    const { data: rows, error } = await supabaseAdmin
      .from("dashboard_permissions")
      .select("id, guild_id, role_id, areas, updated_at")
      .eq("guild_id", data.guildId);
    if (error) throw new Error(error.message);
    return (rows ?? []) as DashboardPermissionRow[];
  });

const UpsertInput = z.object({
  guildId: z.string().regex(/^\d{5,32}$/),
  roleId: z.string().regex(/^\d{5,32}$/),
  areas: z.array(z.enum([...DASHBOARD_AREAS, "all"] as [string, ...string[]])),
});

export const upsertDashboardPermission = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UpsertInput.parse(d))
  .handler(async ({ data }) => {
    const { assertCanAccessArea, writeAudit } = await import("./permissions-audit.server");
    const actor = await assertCanAccessArea(data.guildId, "permissions");
    const { supabaseAdmin } = await import("@/lib/supabase-admin.server");
    const { data: prev } = await supabaseAdmin
      .from("dashboard_permissions")
      .select("areas")
      .eq("guild_id", data.guildId)
      .eq("role_id", data.roleId)
      .maybeSingle();
    const { data: row, error } = await supabaseAdmin
      .from("dashboard_permissions")
      .upsert(
        {
          guild_id: data.guildId,
          role_id: data.roleId,
          areas: data.areas,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "guild_id,role_id" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit({
      guildId: data.guildId,
      event: "permissions.upsert",
      actor,
      target_id: data.roleId,
      before: prev ? { areas: prev.areas } : null,
      after: { areas: data.areas },
    });
    return row as DashboardPermissionRow;
  });

const RemoveInput = z.object({
  guildId: z.string().regex(/^\d{5,32}$/),
  roleId: z.string().regex(/^\d{5,32}$/),
});

export const removeDashboardPermission = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RemoveInput.parse(d))
  .handler(async ({ data }) => {
    const { assertCanAccessArea, writeAudit } = await import("./permissions-audit.server");
    const actor = await assertCanAccessArea(data.guildId, "permissions");
    const { supabaseAdmin } = await import("@/lib/supabase-admin.server");
    const { data: prev } = await supabaseAdmin
      .from("dashboard_permissions")
      .select("areas")
      .eq("guild_id", data.guildId)
      .eq("role_id", data.roleId)
      .maybeSingle();
    const { error } = await supabaseAdmin
      .from("dashboard_permissions")
      .delete()
      .eq("guild_id", data.guildId)
      .eq("role_id", data.roleId);
    if (error) throw new Error(error.message);
    await writeAudit({
      guildId: data.guildId,
      event: "permissions.remove",
      actor,
      target_id: data.roleId,
      before: prev ? { areas: prev.areas } : null,
      after: null,
    });
    return { ok: true };
  });

export const listAuditLog = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string; limit?: number }) =>
    z
      .object({
        guildId: z.string().regex(/^\d{5,32}$/),
        limit: z.number().int().min(1).max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<AuditEntry[]> => {
    const { getActorAndAssertManager } = await import("./permissions-audit.server");
    await getActorAndAssertManager(data.guildId);
    const { supabaseAdmin } = await import("@/lib/supabase-admin.server");
    const { data: rows, error } = await supabaseAdmin
      .from("server_audit_logs")
      .select("id, guild_id, event, actor_id, actor_tag, target_id, before, after, metadata, created_at")
      .eq("guild_id", data.guildId)
      .eq("category", "dashboard")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (error) throw new Error(error.message);
    return (rows ?? []) as AuditEntry[];
  });
