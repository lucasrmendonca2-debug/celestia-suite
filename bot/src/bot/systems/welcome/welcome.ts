import { GuildMember, PartialGuildMember, TextChannel } from "discord.js";
import { getConfig } from "../../utils/guildCache.js";
import { brandEmbed } from "../../utils/embed.js";
import { logger } from "../../utils/logger.js";

function fill(template: string, member: GuildMember | PartialGuildMember): string {
  return template
    .replaceAll("{user}", `<@${member.id}>`)
    .replaceAll("{user.tag}", member.user?.tag ?? "membro")
    .replaceAll("{server}", member.guild.name)
    .replaceAll("{memberCount}", String(member.guild.memberCount));
}

export async function runWelcome(member: GuildMember) {
  try {
    const cfg = await getConfig(member.guild.id);
    if (!cfg.welcomeEnabled) return;

    if (cfg.autoRoleId) {
      const role = member.guild.roles.cache.get(cfg.autoRoleId);
      if (role && member.guild.members.me?.permissions.has("ManageRoles")) {
        await member.roles.add(role).catch(() => {});
      }
    }

    if (cfg.welcomeChannelId) {
      const ch = member.guild.channels.cache.get(cfg.welcomeChannelId);
      if (ch?.isTextBased()) {
        const embed = brandEmbed({
          kind: "success",
          title: `Bem-vindo(a) ao ${member.guild.name}!`,
          description: fill(cfg.welcomeMessage, member),
          thumbnail: member.user.displayAvatarURL({ size: 256 }),
        });
        await (ch as TextChannel).send({ content: `<@${member.id}>`, embeds: [embed] }).catch(() => {});
      }
    }

    if (cfg.welcomeDmEnabled && cfg.welcomeDmMessage) {
      const dm = brandEmbed({
        kind: "info",
        title: `Olá! Bem-vindo(a) ao ${member.guild.name}`,
        description: fill(cfg.welcomeDmMessage, member),
      });
      await member.send({ embeds: [dm] }).catch(() => {});
    }
  } catch (err) {
    logger.error({ err }, "runWelcome falhou");
  }
}

export async function runGoodbye(member: GuildMember | PartialGuildMember) {
  try {
    const cfg = await getConfig(member.guild.id);
    if (!cfg.goodbyeEnabled || !cfg.goodbyeChannelId) return;
    const ch = member.guild.channels.cache.get(cfg.goodbyeChannelId);
    if (!ch?.isTextBased()) return;
    const embed = brandEmbed({
      kind: "warn",
      title: "Até logo 👋",
      description: fill(cfg.goodbyeMessage, member),
    });
    await (ch as TextChannel).send({ embeds: [embed] }).catch(() => {});
  } catch (err) {
    logger.error({ err }, "runGoodbye falhou");
  }
}
