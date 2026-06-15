import type { BotEvent } from "../handlers/events.js";
import { runAutoMod } from "../systems/automod/automod.js";
import { handleMessageXp } from "../systems/level/level.js";
import { handleCustomCommand } from "../systems/custom/custom.js";

const event: BotEvent<"messageCreate"> = {
  name: "messageCreate",
  async execute(_client, message) {
    if (!message.inGuild() || message.author.bot) return;
    const blocked = await runAutoMod(message);
    if (blocked) return;
    await handleCustomCommand(message);
    await handleMessageXp(message);
  },
};

export default event;
