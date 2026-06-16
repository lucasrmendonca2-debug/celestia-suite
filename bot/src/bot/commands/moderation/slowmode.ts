import { SlashCommandBuilder, type TextChannel } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { hasModCapability } from "../../systems/moderation/moderation.permissions.js";
import { getModerationConfig, logModerationEvent } from "../../systems/moderation/moderation.service.js";
import { postModerationLog } from "../../systems/moderation/moderation.logger.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Define o slowmode do canal atual em segundos.")
    .addIntegerOption((o) =>
      o.setName("segundos").setDescription("0 para desativar").setRequired(true).setMinValue(0).setMaxValue(21600),
    ),
  async execute(interaction) {
    const guild = interaction.guild!;
    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_lock_channel"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para alterar slowmode." })],
        ephemeral: true,
      });
    }
    const seconds = interaction.options.getInteger("segundos", true);
    const channel = interaction.channel as TextChannel;
    await channel.setRateLimitPerUser(seconds, `[${interaction.user.tag}] slowmode`);
    const config = await getModerationConfig(guild.id);
    await logModerationEvent({
      guildId: guild.id,
      moderatorId: interaction.user.id,
      action: "SLOWMODE",
      details: { channelId: channel.id, seconds },
    });
    await postModerationLog({
      guild,
      type: "SLOWMODE",
      target: { id: channel.id, tag: `#${channel.name}` },
      moderator: interaction.user,
      reason: `Slowmode: ${seconds}s em <#${channel.id}>`,
      config,
    });
    await interaction.reply({
      embeds: [brandEmbed({ kind: "success", title: "Slowmode atualizado", description: `Agora: **${seconds}s**` })],
      ephemeral: true,
    });
  },
};

export default command;
