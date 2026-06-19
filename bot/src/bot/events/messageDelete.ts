import type { BotEvent } from "../handlers/events.js";
import { logMessageDelete } from "../systems/logs/messageLog.js";

const event: BotEvent<"messageDelete"> = {
  name: "messageDelete",
  async execute(_client, message) {
    if (message.partial) return;
    if (!message.inGuild() || message.author?.bot) return;
    await logMessageDelete(message);
  },
};

export default event;
