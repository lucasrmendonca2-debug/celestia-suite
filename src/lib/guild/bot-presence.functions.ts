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
      // GET /guilds/{id} com Bot token: 200 = bot é membro, 404 = não é, 401 = token inválido.
      // O endpoint /users/@me/guilds/{id}/member requer OAuth2 user token (não funciona com Bot).
      const res = await fetch(
        `https://discord.com/api/v10/guilds/${data.guildId}`,
        { headers: { Authorization: `Bot ${token}` } },
      );
      if (res.ok) {
        return { present: true, inviteUrl };
      }
      if (res.status === 404) {
        return { present: false, inviteUrl };
      }
      const body = await res.text().catch(() => "");
      console.warn(
        `[bot-presence] guild=${data.guildId} status=${res.status} body=${body.slice(0, 200)}`,
      );
      return { present: false, inviteUrl };
    } catch (err) {
      console.error("[bot-presence] fetch falhou", err);
      return { present: false, inviteUrl };
    }
  });
