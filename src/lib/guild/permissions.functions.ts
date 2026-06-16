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

export interface AuditEntry {
  id: string;
  guild_id: string;
  event: string;
  actor_id: string | null;
  actor_tag: string | null;
  target_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

async function getActor(): Promise<{ id: string; tag: string; accessToken: string }> {
  const { getSession } = await import("@/lib/auth/session.server");
  const session = await getSession();
  if (!session.data.userId || !session.data.accessToken) {
    throw new Error("Não autenticado.");
  }
  return {
    id: session.data.userId,
    tag: session.data.username ?? session.data.userId,
    accessToken: session.data.accessToken,
  };
}

async function assertManagerOf(guildId: string, accessToken: string): Promise<void> {
  const { fetchUserGuilds, filterManageableGuilds } = await import(
    "@/lib/auth/discord.server"
  );
  const guilds = await fetchUserGuilds(accessToken);
  if (!filterManageableGuilds(guilds).some((g) => g.id === guildId)) {
    throw new Error("Sem permissão pra esse servidor.");
  }
}

async function fetchMemberRoles(guildId: string, userId: string): Promise<string[]> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return [];
  const res = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
    { headers: { Authorization: `Bot ${token}` } },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { roles?: string[] };
  return data.roles ?? [];
}

/**
 * Garante acesso a uma área. Usar dentro de updates do dashboard.
 * Retorna o id do ator pra gravar em audit log.
 */
export async function assertCanAccessArea(
  guildId: string,
  area: DashboardArea,
): Promise<{ id: string; tag: string }> {
  const actor = await getActor();
  await assertManagerOf(guildId, actor.accessToken);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: rows, error } = await supabaseAdmin
    .from("dashboard_permissions")
    .select("role_id, areas")
    .eq("guild_id", guildId);
  if (error) throw new Error(error.message);

  // sem regras → manager passa
  if (!rows || rows.length === 0) return { id: actor.id, tag: actor.tag };

  const memberRoles = new Set(await fetchMemberRoles(guildId, actor.id));
  const allowed = rows.some((r) => {
    if (!memberRoles.has(r.role_id)) return false;
    const areas = r.areas as string[];
    return areas.includes("all") || areas.includes(area);
  });
  if (!allowed) throw new Error("Seu cargo não tem acesso a essa área.");
  return { id: actor.id, tag: actor.tag };
}

/** Grava no audit log. Falha silenciosamente — log nunca derruba update. */
export async function writeAudit(opts: {
  guildId: string;
  event: string;
  actor: { id: string; tag: string };
  before?: unknown;
  after?: unknown;
  target_id?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("server_audit_logs").insert({
      guild_id: opts.guildId,
      category: "dashboard",
      event: opts.event,
      actor_id: opts.actor.id,
      actor_tag: opts.actor.tag,
      target_id: opts.target_id ?? null,
      before: (opts.before ?? null) as never,
      after: (opts.after ?? null) as never,
      metadata: (opts.metadata ?? null) as never,
    });
  } catch (e) {
    console.warn("[audit] falhou:", (e as Error).message);
  }
}

const GuildInput = z.object({ guildId: z.string().regex(/^\d{5,32}$/) });

export const listDashboardPermissions = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => GuildInput.parse(d))
  .handler(async ({ data }): Promise<DashboardPermissionRow[]> => {
    const actor = await getActor();
    await assertManagerOf(data.guildId, actor.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
    // só quem já passa por 'permissions' pode mexer
    const actor = await assertCanAccessArea(data.guildId, "permissions");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
    const actor = await assertCanAccessArea(data.guildId, "permissions");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
    const actor = await getActor();
    await assertManagerOf(data.guildId, actor.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
