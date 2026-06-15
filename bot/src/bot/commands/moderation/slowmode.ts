import { SlashCommandBuilder, PermissionFlagsBits, TextChannel } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 5,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageChannels],
  botPermissions: [PermissionFlagsBits.ManageChannels],
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Define o slowmode do canal atual em segundos.")
    .addIntegerOption((o) => o.setName("segundos").setDescription("0 para desativar").setRequired(true).setMinValue(0).setMaxValue(21600)),
  async execute(interaction) {
    const seconds = interaction.options.getInteger("segundos", true);
    const channel = interaction.channel as TextChannel;
    await channel.setRateLimitPerUser(seconds, `[${interaction.user.tag}] slowmode`);
    await interaction.reply({
      embeds: [brandEmbed({ kind: "success", title: "Slowmode atualizado", description: `Agora: **${seconds}s**` })],
      ephemeral: true,
    });
  },
};

export default command;
