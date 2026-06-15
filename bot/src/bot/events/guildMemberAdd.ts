import type { BotEvent } from "../handlers/events.js";
import { ensureGuild } from "../utils/guildCache.js";
import { runWelcome } from "../systems/welcome/welcome.js";

const event: BotEvent<"guildMemberAdd"> = {
  name: "guildMemberAdd",
  async execute(_client, member) {
    await ensureGuild(member.guild);
    await runWelcome(member);
  },
};

export default event;
