import { SlashCommandBuilder, PermissionFlagsBits, TextChannel } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 5,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageMessages],
  botPermissions: [PermissionFlagsBits.ManageMessages],
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Apaga mensagens recentes do canal.")
    .addIntegerOption((o) => o.setName("quantidade").setDescription("1-100").setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption((o) => o.setName("usuario").setDescription("Apenas mensagens deste usuário")),
  async execute(interaction) {
    const amount = interaction.options.getInteger("quantidade", true);
    const user = interaction.options.getUser("usuario");
    const channel = interaction.channel as TextChannel;
    await interaction.deferReply({ ephemeral: true });
    const messages = await channel.messages.fetch({ limit: 100 });
    const target = user ? messages.filter((m) => m.author.id === user.id).first(amount) : Array.from(messages.values()).slice(0, amount);
    const deleted = await channel.bulkDelete(target, true);
    await interaction.editReply({
      embeds: [brandEmbed({ kind: "success", title: "Mensagens apagadas", description: `Removidas **${deleted.size}** mensagens.` })],
    });
  },
};

export default command;
