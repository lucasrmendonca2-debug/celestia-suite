import { EmbedBuilder } from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { ensureGuild } from "../utils/guildCache.js";
import { runWelcome } from "../systems/welcome/welcome.js";
import { postLog } from "../systems/logs/logger.service.js";

const event: BotEvent<"guildMemberAdd"> = {
  name: "guildMemberAdd",
  async execute(_client, member) {
    await ensureGuild(member.guild);
    await runWelcome(member);

    const created = member.user.createdAt;
    const ageDays = Math.floor((Date.now() - created.getTime()) / 86400000);
    const embed = new EmbedBuilder()
      .setTitle("📥 Membro entrou")
      .setThumbnail(member.user.displayAvatarURL())
      .setDescription(
        [
          `**Usuário:** <@${member.id}> (\`${member.user.tag}\`)`,
          `**Conta criada:** <t:${Math.floor(created.getTime() / 1000)}:R> (${ageDays} dias)`,
          `**Membros agora:** ${member.guild.memberCount}`,
        ].join("\n"),
      );
    await postLog({
      guild: member.guild,
      category: "member",
      event: "guildMemberAdd",
      toggleKey: "member_join",
      target: { id: member.id, tag: member.user.tag },
      metadata: { accountAgeDays: ageDays },
      embed,
    });
  },
};

export default event;
