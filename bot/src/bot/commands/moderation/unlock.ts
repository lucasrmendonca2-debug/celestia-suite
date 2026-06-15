import { SlashCommandBuilder, PermissionFlagsBits, TextChannel } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 5,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageChannels],
  botPermissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles],
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Destranca o canal atual."),
  async execute(interaction) {
    const channel = interaction.channel as TextChannel;
    await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: null });
    await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "🔓 Canal destrancado" })] });
  },
};

export default command;
