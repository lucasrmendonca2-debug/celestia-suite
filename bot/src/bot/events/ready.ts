import { ActivityType } from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { logger } from "../utils/logger.js";
import { ensureGuild } from "../utils/guildCache.js";

const event: BotEvent<"ready"> = {
  name: "ready",
  once: true,
  async execute(client) {
    logger.info(`✅ Logado como ${client.user?.tag} • ${client.guilds.cache.size} servidores`);
    client.user?.setPresence({
      status: "online",
      activities: [{ name: `/help • ${client.guilds.cache.size} servidores`, type: ActivityType.Watching }],
    });
    // Sincroniza guilds atuais com o banco
    for (const [, guild] of client.guilds.cache) {
      await ensureGuild(guild).catch((err) => logger.error({ err, guildId: guild.id }, "ensureGuild"));
    }
  },
};

export default event;
