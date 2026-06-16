import { EmbedBuilder } from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { runGoodbye } from "../systems/welcome/welcome.js";
import { postLog } from "../systems/logs/logger.service.js";

const event: BotEvent<"guildMemberRemove"> = {
  name: "guildMemberRemove",
  async execute(_client, member) {
    await runGoodbye(member);

    const joined = member.joinedAt;
    const stayedDays = joined ? Math.floor((Date.now() - joined.getTime()) / 86400000) : null;
    const roles = member.roles?.cache
      ?.filter((r) => r.name !== "@everyone")
      .map((r) => `<@&${r.id}>`)
      .join(" ");
    const embed = new EmbedBuilder()
      .setTitle("📤 Membro saiu")
      .setThumbnail(member.user.displayAvatarURL())
      .setDescription(
        [
          `**Usuário:** <@${member.id}> (\`${member.user.tag}\`)`,
          joined ? `**Ficou no servidor:** ${stayedDays} dia(s)` : "",
          roles ? `**Cargos:** ${roles}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      );
    await postLog({
      guild: member.guild,
      category: "member",
      event: "guildMemberRemove",
      toggleKey: "member_leave",
      target: { id: member.id, tag: member.user.tag },
      metadata: { stayedDays },
      embed,
    });
  },
};

export default event;
