/**
 * Verifica se o bot está em um servidor.
 * Mesmo modelo usado por dashboards de bots: a API do Discord é consultada
 * com token de BOT; 200 = instalado, 404/403 = fora/sem acesso, 401 = token errado.
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
    const inviteUrl = buildInviteUrl(data.guildId);
    try {
      const { getBotPresenceForGuild } = await import("./bot-presence.server");
      const presence = await getBotPresenceForGuild(data.guildId);
      return { present: presence.present, inviteUrl };
    } catch (err) {
      console.error("[bot-presence] verificação falhou", err);
      return { present: false, inviteUrl };
    }
  });
