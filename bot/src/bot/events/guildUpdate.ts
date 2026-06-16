import { EmbedBuilder } from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { postLog } from "../systems/logs/logger.service.js";

const event: BotEvent<"guildUpdate"> = {
  name: "guildUpdate",
  async execute(_client, oldGuild, newGuild) {
    const diffs: string[] = [];
    if (oldGuild.name !== newGuild.name) diffs.push(`**Nome:** \`${oldGuild.name}\` → \`${newGuild.name}\``);
    if (oldGuild.iconURL() !== newGuild.iconURL()) diffs.push("**Ícone alterado**");
    if (oldGuild.ownerId !== newGuild.ownerId)
      diffs.push(`**Dono:** <@${oldGuild.ownerId}> → <@${newGuild.ownerId}>`);
    if (!diffs.length) return;
    const embed = new EmbedBuilder().setTitle("🛡️ Servidor atualizado").setDescription(diffs.join("\n"));
    await postLog({
      guild: newGuild,
      category: "server",
      event: "guildUpdate",
      toggleKey: "server_update",
      before: { name: oldGuild.name, ownerId: oldGuild.ownerId },
      after: { name: newGuild.name, ownerId: newGuild.ownerId },
      embed,
    });
  },
};
export default event;
