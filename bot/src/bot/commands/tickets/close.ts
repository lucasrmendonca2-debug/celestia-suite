import { SlashCommandBuilder, TextChannel, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { closeTicket } from "../../systems/tickets/handlers.js";

const command: SlashCommand = {
  category: "tickets",
  cooldown: 3,
  guildOnly: true,
  botPermissions: [PermissionFlagsBits.ManageChannels],
  data: new SlashCommandBuilder()
    .setName("close")
    .setDescription("Fecha o ticket atual."),
  async execute(interaction) {
    try {
      await closeTicket(interaction.channel as TextChannel, interaction.user.id);
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Ticket fechado" })], ephemeral: true });
    } catch (err) {
      await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Erro", description: (err as Error).message })], ephemeral: true });
    }
  },
};

export default command;
