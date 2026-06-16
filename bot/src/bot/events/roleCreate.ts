import { EmbedBuilder } from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { postLog } from "../systems/logs/logger.service.js";

const event: BotEvent<"roleCreate"> = {
  name: "roleCreate",
  async execute(_client, role) {
    const embed = new EmbedBuilder()
      .setTitle("🎭 Cargo criado")
      .setDescription(
        [
          `**Cargo:** <@&${role.id}> (\`${role.name}\`)`,
          `**Cor:** \`#${role.color.toString(16).padStart(6, "0")}\``,
          `**Exibido separadamente:** ${role.hoist ? "sim" : "não"}`,
          `**Mencionável:** ${role.mentionable ? "sim" : "não"}`,
        ].join("\n"),
      );
    await postLog({
      guild: role.guild,
      category: "role",
      event: "roleCreate",
      toggleKey: "role_create",
      target: { id: role.id, tag: role.name },
      embed,
    });
  },
};
export default event;
