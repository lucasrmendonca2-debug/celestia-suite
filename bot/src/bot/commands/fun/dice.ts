import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";

const command: SlashCommand = {
  category: "fun",
  cooldown: 2,
  data: new SlashCommandBuilder()
    .setName("dados").setNameLocalizations({"en-US":"dice"})
    .setDescription("Rola um dado.")
    .addIntegerOption((o) => o.setName("lados").setDescription("Lados (padrão 6)").setMinValue(2).setMaxValue(1000))
    .addIntegerOption((o) => o.setName("quantidade").setDescription("Quantidade (padrão 1)").setMinValue(1).setMaxValue(20)),
  async execute(interaction) {
    const sides = interaction.options.getInteger("lados") ?? 6;
    const qty = interaction.options.getInteger("quantidade") ?? 1;
    const rolls = Array.from({ length: qty }, () => 1 + Math.floor(Math.random() * sides));
    const total = rolls.reduce((a, b) => a + b, 0);
    await interaction.reply({
      embeds: [brandEmbed({ title: `🎲 d${sides} ×${qty}`, description: `Resultados: ${rolls.join(", ")}\n**Total:** ${total}` })],
    });
  },
};
export default command;
