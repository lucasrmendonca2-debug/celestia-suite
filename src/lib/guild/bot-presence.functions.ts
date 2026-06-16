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
    if (!token) {
      return { present: false, inviteUrl: buildInviteUrl(data.guildId) };
    }
    try {
      const res = await fetch(`https://discord.com/api/v10/guilds/${data.guildId}`, {
        headers: { Authorization: `Bot ${token}` },
      });
      return {
        present: res.ok,
        inviteUrl: buildInviteUrl(data.guildId),
      };
    } catch {
      return { present: false, inviteUrl: buildInviteUrl(data.guildId) };
    }
  });
