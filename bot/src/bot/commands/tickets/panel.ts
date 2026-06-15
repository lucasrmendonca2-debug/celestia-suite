import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
} from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { prisma } from "../../../database/client.js";

const command: SlashCommand = {
  category: "tickets",
  cooldown: 5,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName("ticket-panel")
    .setDescription("Cria um painel de abertura de tickets neste canal.")
    .addStringOption((o) => o.setName("titulo").setDescription("Título do painel"))
    .addStringOption((o) => o.setName("descricao").setDescription("Descrição do painel"))
    .addStringOption((o) => o.setName("botao").setDescription("Texto do botão"))
    .addChannelOption((o) => o.setName("categoria").setDescription("Categoria onde os tickets serão criados"))
    .addRoleOption((o) => o.setName("cargo_suporte").setDescription("Cargo da equipe de suporte")),
  async execute(interaction) {
    const title = interaction.options.getString("titulo") ?? "🎫 Suporte";
    const description = interaction.options.getString("descricao") ?? "Precisa de ajuda? Clique no botão abaixo para abrir um ticket privado com a equipe.";
    const buttonLabel = interaction.options.getString("botao") ?? "Abrir ticket";
    const category = interaction.options.getChannel("categoria");
    const role = interaction.options.getRole("cargo_suporte");
    const channel = interaction.channel as TextChannel;

    const panel = await prisma.ticketPanel.create({
      data: {
        guildId: interaction.guildId!,
        channelId: channel.id,
        title,
        description,
        buttonLabel,
        categoryId: category?.id ?? null,
        supportRoleId: role?.id ?? null,
      },
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`ticket:open:${panel.id}`).setLabel(buttonLabel).setStyle(ButtonStyle.Primary).setEmoji("🎫"),
    );

    const msg = await channel.send({
      embeds: [brandEmbed({ title, description })],
      components: [row],
    });

    await prisma.ticketPanel.update({ where: { id: panel.id }, data: { messageId: msg.id } });
    await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Painel criado", description: `ID: \`${panel.id}\`` })], ephemeral: true });
  },
};

export default command;
