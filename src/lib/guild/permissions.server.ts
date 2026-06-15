/**
 * Server-only helper: valida que o usuário logado pode gerenciar a guild.
 * Retorna o userId do Discord.
 */
import { getSession } from "@/lib/auth/session.server";
import { fetchUserGuilds, filterManageableGuilds } from "@/lib/auth/discord.server";

export async function assertCanManageGuild(guildId: string): Promise<string> {
  const session = await getSession();
  if (!session.data.userId || !session.data.accessToken) {
    throw new Error("Não autenticado.");
  }
  const guilds = await fetchUserGuilds(session.data.accessToken);
  const manageable = filterManageableGuilds(guilds);
  if (!manageable.some((g) => g.id === guildId)) {
    throw new Error("Sem permissão para gerenciar esse servidor.");
  }
  return session.data.userId;
}
