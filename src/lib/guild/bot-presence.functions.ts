/**
 * Verifica se o bot está em um servidor (via GET /guilds/{id} com bot token).
 */
import { createServerFn } from "@tanstack/react-start";

export interface BotPresence {
  present: boolean;
  inviteUrl: string;
}

function buildInviteUrl(guildId: string): string {
  const clientId = process.env.DISCORD_CLIENT_ID ?? "";
  const perms = "8"; // Administrator (ajuste conforme o convite oficial do bot)
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot+applications.commands&permissions=${perms}&guild_id=${guildId}&disable_guild_select=true`;
}

export const checkBotInGuild = createServerFn({ method: "GET" })
  .inputValidator((data: { guildId: string }) => {
    if (!data?.guildId || !/^\d{5,30}$/.test(data.guildId)) {
      throw new Error("guildId inválido");
    }
    return data;
  })
  .handler(async ({ data }): Promise<BotPresence> => {
    const token = process.env.DISCORD_BOT_TOKEN;
    const inviteUrl = buildInviteUrl(data.guildId);
    if (!token) {
      console.warn("[bot-presence] DISCORD_BOT_TOKEN ausente — assumindo bot fora do servidor");
      return { present: false, inviteUrl };
    }
    try {
      // /guilds/{id}/members/@me só responde 200 quando o bot é membro.
      // É mais preciso que /guilds/{id} (que pode 200 com permissões parciais/cache).
      const res = await fetch(
        `https://discord.com/api/v10/users/@me/guilds/${data.guildId}/member`,
        { headers: { Authorization: `Bot ${token}` } },
      );
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.warn(
          `[bot-presence] guild=${data.guildId} status=${res.status} body=${body.slice(0, 200)}`,
        );
      }
      return { present: res.ok, inviteUrl };
    } catch (err) {
      console.error("[bot-presence] fetch falhou", err);
      return { present: false, inviteUrl };
    }
  });
