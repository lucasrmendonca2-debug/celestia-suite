import { SlashCommandBuilder, TextChannel, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { prisma } from "../../../database/client.js";

const command: SlashCommand = {
  category: "tickets",
  cooldown: 3,
  guildOnly: true,
  botPermissions: [PermissionFlagsBits.ManageChannels],
  data: new SlashCommandBuilder()
    .setName("ticket-add")
    .setDescription("Adiciona um usuário ao ticket atual.")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário a adicionar").setRequired(true)),
  async execute(interaction) {
    const channel = interaction.channel as TextChannel;
    const ticket = await prisma.ticket.findUnique({ where: { channelId: channel.id } });
    if (!ticket || ticket.status !== "OPEN") {
      return interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Este canal não é um ticket aberto" })], ephemeral: true });
    }
    const user = interaction.options.getUser("usuario", true);
    await channel.permissionOverwrites.edit(user.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });
    await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Adicionado", description: `<@${user.id}> agora tem acesso ao ticket.` })] });
  },
};

export default command;
