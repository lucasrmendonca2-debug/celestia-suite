import { EmbedBuilder } from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { postLog } from "../systems/logs/logger.service.js";

const event: BotEvent<"roleUpdate"> = {
  name: "roleUpdate",
  async execute(_client, oldRole, newRole) {
    const diffs: string[] = [];
    if (oldRole.name !== newRole.name) diffs.push(`**Nome:** \`${oldRole.name}\` → \`${newRole.name}\``);
    if (oldRole.color !== newRole.color)
      diffs.push(
        `**Cor:** \`#${oldRole.color.toString(16).padStart(6, "0")}\` → \`#${newRole.color
          .toString(16)
          .padStart(6, "0")}\``,
      );
    if (oldRole.hoist !== newRole.hoist) diffs.push(`**Hoist:** ${oldRole.hoist} → ${newRole.hoist}`);
    if (oldRole.mentionable !== newRole.mentionable)
      diffs.push(`**Mencionável:** ${oldRole.mentionable} → ${newRole.mentionable}`);
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield)
      diffs.push("**Permissões alteradas**");
    if (!diffs.length) return;

    const embed = new EmbedBuilder()
      .setTitle("🎭 Cargo atualizado")
      .setDescription([`<@&${newRole.id}>`, "", ...diffs].join("\n"));
    await postLog({
      guild: newRole.guild,
      category: "role",
      event: "roleUpdate",
      toggleKey: "role_update",
      target: { id: newRole.id, tag: newRole.name },
      before: { name: oldRole.name, color: oldRole.color, perms: oldRole.permissions.bitfield.toString() },
      after: { name: newRole.name, color: newRole.color, perms: newRole.permissions.bitfield.toString() },
      embed,
    });
  },
};
export default event;
