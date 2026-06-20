/**
 * Lista canais e cargos REAIS de um servidor via API do Discord usando o bot token.
 * Exige que o usuário logado tenha permissão de gerenciar a guild.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface DiscordChannel {
  id: string;
  name: string;
  type: number; // 0=text, 2=voice, 4=category, 5=announcement, 15=forum, etc
  parent_id: string | null;
  position: number;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
  hoist: boolean;
}

async function assertCanManage(guildId: string): Promise<void> {
  const { getSession } = await import("@/lib/auth/session.server");
  const { fetchUserGuilds, filterManageableGuilds } = await import(
    "@/lib/auth/discord.server"
  );
  const session = await getSession();
  if (!session.data.userId || !session.data.accessToken) {
    throw new Error("Não autenticado.");
  }
  const guilds = await fetchUserGuilds(session.data.accessToken);
  if (!filterManageableGuilds(guilds).some((g) => g.id === guildId)) {
    throw new Error("Sem permissão pra esse servidor.");
  }
}

async function botFetch<T>(path: string): Promise<T> {
  const { getDiscordBotToken } = await import("@/lib/discord/bot-token.server");
  const token = getDiscordBotToken();
  if (!token) throw new Error("Token do bot ausente.");
  const res = await fetch(`https://discord.com/api/v10${path}`, {
    headers: { Authorization: `Bot ${token}` },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Discord ${res.status}: ${txt.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

const Input = z.object({ guildId: z.string().regex(/^\d{5,32}$/) });

export const listGuildChannels = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => Input.parse(d))
  .handler(async ({ data }): Promise<DiscordChannel[]> => {
    await assertCanManage(data.guildId);
    const raw = await botFetch<DiscordChannel[]>(
      `/guilds/${data.guildId}/channels`,
    );
    return raw
      .map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        parent_id: c.parent_id ?? null,
        position: c.position ?? 0,
      }))
      .sort((a, b) => a.position - b.position);
  });

export const listGuildRoles = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => Input.parse(d))
  .handler(async ({ data }): Promise<DiscordRole[]> => {
    await assertCanManage(data.guildId);
    const raw = await botFetch<DiscordRole[]>(
      `/guilds/${data.guildId}/roles`,
    );
    return raw
      .filter((r) => r.name !== "@everyone")
      .map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        position: r.position,
        managed: r.managed,
        hoist: r.hoist,
      }))
      .sort((a, b) => b.position - a.position);
  });
