import { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { Marriage } from "../../../database/models.js";

const command: SlashCommand = {
  category: "interaction",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("marry")
    .setDescription("Pede alguém em casamento. 💍")
    .addUserOption((o) => o.setName("usuario").setDescription("Sua cara-metade").setRequired(true)),
  async execute(interaction) {
    const target = interaction.options.getUser("usuario", true);
    if (target.bot || target.id === interaction.user.id) {
      await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Alvo inválido" })], ephemeral: true });
      return;
    }
    const existing = await Marriage.findOne({
      status: "MARRIED",
      $or: [
        { userA: interaction.user.id }, { userB: interaction.user.id },
        { userA: target.id }, { userB: target.id },
      ],
    });
    if (existing) {
      await interaction.reply({ embeds: [brandEmbed({ kind: "warn", title: "Já há um casamento ativo" })], ephemeral: true });
      return;
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("marry:yes").setStyle(ButtonStyle.Success).setLabel("Aceitar 💍"),
      new ButtonBuilder().setCustomId("marry:no").setStyle(ButtonStyle.Danger).setLabel("Recusar"),
    );

    const msg = await interaction.reply({
      content: `<@${target.id}>`,
      embeds: [brandEmbed({ title: "💍 Pedido de casamento", description: `${interaction.user} está pedindo ${target} em casamento!` })],
      components: [row],
      fetchReply: true,
    });

    try {
      const click = await msg.awaitMessageComponent({
        componentType: ComponentType.Button,
        time: 60_000,
        filter: (i) => i.user.id === target.id,
      });
      if (click.customId === "marry:yes") {
        await Marriage.create({ userA: interaction.user.id, userB: target.id, status: "MARRIED", marriedAt: new Date() });
        await click.update({
          embeds: [brandEmbed({ kind: "success", title: "💖 Casamento celebrado!", description: `${interaction.user} e ${target} estão oficialmente casados 🎉` })],
          components: [],
        });
      } else {
        await click.update({
          embeds: [brandEmbed({ kind: "warn", title: "💔 Pedido recusado", description: `${target} recusou ${interaction.user}` })],
          components: [],
        });
      }
    } catch {
      await interaction.editReply({
        embeds: [brandEmbed({ kind: "warn", title: "Sem resposta", description: "O pedido expirou." })],
        components: [],
      });
    }
  },
};
export default command;
