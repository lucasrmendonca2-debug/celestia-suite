import type { Message } from "discord.js";
import { CustomCommand } from "../../../database/models.js";
import { applyVars } from "../../utils/format.js";
import { brandEmbed } from "../../utils/embed.js";

const PREFIX_DEFAULT = "!";

export async function handleCustomCommand(msg: Message): Promise<boolean> {
  if (!msg.inGuild() || msg.author.bot) return false;
  if (!msg.content?.startsWith(PREFIX_DEFAULT)) return false;
  const name = msg.content.slice(PREFIX_DEFAULT.length).split(/\s+/)[0]?.toLowerCase();
  if (!name) return false;

  const cmd = await CustomCommand.findOne({ guildId: msg.guildId, name, enabled: true });
  if (!cmd) return false;

  const vars = {
    user: `<@${msg.author.id}>`,
    userTag: msg.author.tag,
    server: msg.guild.name,
    memberCount: msg.guild.memberCount,
    channel: `<#${msg.channelId}>`,
  };
  const text = applyVars(cmd.response, vars);

  if (cmd.deleteTrigger) await msg.delete().catch(() => {});

  if (cmd.embed) {
    await msg.channel.send({ embeds: [brandEmbed({ description: text })] }).catch(() => {});
  } else {
    await msg.channel.send({ content: text }).catch(() => {});
  }

  cmd.uses += 1;
  await cmd.save();
  return true;
}
