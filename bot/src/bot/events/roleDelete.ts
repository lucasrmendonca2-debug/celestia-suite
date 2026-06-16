import { EmbedBuilder } from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { postLog } from "../systems/logs/logger.service.js";

const event: BotEvent<"roleDelete"> = {
  name: "roleDelete",
  async execute(_client, role) {
    const embed = new EmbedBuilder()
      .setTitle("🗑️ Cargo deletado")
      .setDescription(
        [`**Nome:** \`${role.name}\``, `**ID:** \`${role.id}\``].join("\n"),
      );
    await postLog({
      guild: role.guild,
      category: "role",
      event: "roleDelete",
      toggleKey: "role_delete",
      target: { id: role.id, tag: role.name },
      embed,
    });
  },
};
export default event;
