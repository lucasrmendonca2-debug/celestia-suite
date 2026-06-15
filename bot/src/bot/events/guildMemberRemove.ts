import type { BotEvent } from "../handlers/events.js";
import { runGoodbye } from "../systems/welcome/welcome.js";

const event: BotEvent<"guildMemberRemove"> = {
  name: "guildMemberRemove",
  async execute(_client, member) {
    await runGoodbye(member);
  },
};

export default event;
