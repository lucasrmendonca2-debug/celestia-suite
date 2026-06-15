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
    .setName("lock")
    .setDescription("Tranca o canal atual (impede @everyone de enviar mensagens)."),
  async execute(interaction) {
    const channel = interaction.channel as TextChannel;
    await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: false });
    await interaction.reply({ embeds: [brandEmbed({ kind: "warn", title: "🔒 Canal trancado" })] });
  },
};

export default command;
