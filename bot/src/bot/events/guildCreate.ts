import type { BotEvent } from "../handlers/events.js";
import { ensureGuild } from "../utils/guildCache.js";
import { logger } from "../utils/logger.js";

const event: BotEvent<"guildCreate"> = {
  name: "guildCreate",
  async execute(_client, guild) {
    logger.info({ guildId: guild.id, name: guild.name }, "🎉 Bot adicionado a um servidor");
    await ensureGuild(guild);
  },
};

export default event;
