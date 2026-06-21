/**
 * Server-only helpers para dashboard_permissions + audit log.
 * Importado SOMENTE dentro de `.handler()` de server fns (dynamic import).
 */
import { getSession } from "@/lib/auth/session.server";
import {
  fetchUserGuilds,
  filterManageableGuilds,
} from "@/lib/auth/discord.server";
import { supabaseAdmin } from "@/lib/supabase-admin.server";
import { getDiscordBotToken } from "@/lib/discord/bot-token.server";
import type { DashboardArea } from "./permissions.functions";

export interface Actor {
  id: string;
  tag: string;
}

async function getActor(): Promise<Actor & { accessToken: string }> {
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

export async function assertManagerOf(
  guildId: string,
  accessToken: string,
): Promise<void> {
  const guilds = await fetchUserGuilds(accessToken);
  if (!filterManageableGuilds(guilds).some((g) => g.id === guildId)) {
    throw new Error("Sem permissão pra esse servidor.");
  }
}

export async function getActorAndAssertManager(
  guildId: string,
): Promise<Actor> {
  const a = await getActor();
  await assertManagerOf(guildId, a.accessToken);
  return { id: a.id, tag: a.tag };
}

async function fetchMemberRoles(
  guildId: string,
  userId: string,
): Promise<string[]> {
  const token = getDiscordBotToken();
  if (!token) return [];
  const res = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
    { headers: { Authorization: `Bot ${token}` } },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { roles?: string[] };
  return data.roles ?? [];
}

export async function assertCanAccessArea(
  guildId: string,
  area: DashboardArea,
): Promise<Actor> {
  const actor = await getActor();
  await assertManagerOf(guildId, actor.accessToken);

  // Dono da guild sempre passa — evita lockout depois de configurar permissões.
  const guilds = await fetchUserGuilds(actor.accessToken);
  const g = guilds.find((x) => x.id === guildId);
  if (g?.owner) return { id: actor.id, tag: actor.tag };

  const { data: rows, error } = await supabaseAdmin
    .from("dashboard_permissions")
    .select("role_id, areas")
    .eq("guild_id", guildId);
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) return { id: actor.id, tag: actor.tag };

  const memberRoles = new Set(await fetchMemberRoles(guildId, actor.id));
  const allowed = rows.some((r) => {
    if (!memberRoles.has(r.role_id)) return false;
    const areas = r.areas as string[];
    return areas.includes("all") || areas.includes(area);
  });
  if (!allowed) throw new Error("Seu cargo não tem acesso a essa área. (Donos da guild sempre passam.)");
  return { id: actor.id, tag: actor.tag };
}

export async function writeAudit(opts: {
  guildId: string;
  event: string;
  actor: Actor;
  before?: unknown;
  after?: unknown;
  target_id?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
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
