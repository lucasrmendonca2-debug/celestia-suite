import type { BotEvent } from "../handlers/events.js";
import { recordGuildLeft } from "../utils/guildCache.js";
import { logger } from "../utils/logger.js";

const event: BotEvent<"guildDelete"> = {
  name: "guildDelete",
  execute(_client, guild) {
    logger.info({ guildId: guild.id, name: guild.name }, "👋 Bot removido de um servidor");
    recordGuildLeft(guild.id);
  },
};

export default event;
