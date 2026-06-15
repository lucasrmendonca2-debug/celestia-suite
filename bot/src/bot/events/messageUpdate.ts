import type { BotEvent } from "../handlers/events.js";
import { logMessageEdit } from "../systems/logs/messageLog.js";

const event: BotEvent<"messageUpdate"> = {
  name: "messageUpdate",
  async execute(_client, oldMsg, newMsg) {
    if (oldMsg.partial || newMsg.partial) return;
    if (!newMsg.guild || newMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;
    await logMessageEdit(oldMsg, newMsg);
  },
};

export default event;
