import type { Message } from "discord.js";
import { applyVars } from "../../utils/format.js";
import { brandEmbed } from "../../utils/embed.js";
import { getCustomCommand, incrementCustomCommandUses } from "../../repositories/content.repo.js";

const PREFIX_DEFAULT = "!";

export async function handleCustomCommand(msg: Message): Promise<boolean> {
  if (!msg.inGuild() || msg.author.bot) return false;
  if (!msg.content?.startsWith(PREFIX_DEFAULT)) return false;
  const name = msg.content.slice(PREFIX_DEFAULT.length).split(/\s+/)[0]?.toLowerCase();
  if (!name) return false;

  const cmd = await getCustomCommand(msg.guildId!, name, { onlyEnabled: true }).catch(() => null);
  if (!cmd || !cmd.response_text) return false;

  const vars = {
    user: `<@${msg.author.id}>`,
    userTag: msg.author.tag,
    server: msg.guild.name,
    memberCount: msg.guild.memberCount,
    channel: `<#${msg.channelId}>`,
  };
  const text = applyVars(cmd.response_text, vars);

  const useEmbed = !!cmd.embed;
  if (useEmbed) {
    await msg.channel.send({ embeds: [brandEmbed({ description: text })] }).catch(() => {});
  } else {
    await msg.channel.send({ content: text }).catch(() => {});
  }

  void incrementCustomCommandUses(cmd.id);
  return true;
}
