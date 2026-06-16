import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";

const command: SlashCommand = {
  category: "fun",
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName("moeda").setNameLocalizations({"en-US":"coinflip"})
    .setDescription("Joga uma moeda — cara ou coroa.")
    .addStringOption((o) =>
      o.setName("aposta").setDescription("cara ou coroa").addChoices({ name: "Cara", value: "cara" }, { name: "Coroa", value: "coroa" }),
    ),
  async execute(interaction) {
    const guess = interaction.options.getString("aposta");
    const result = Math.random() < 0.5 ? "cara" : "coroa";
    const win = guess && guess === result;
    await interaction.reply({
      embeds: [
        brandEmbed({
          kind: guess ? (win ? "success" : "error") : "default",
          title: `🪙 ${result.toUpperCase()}!`,
          description: guess ? (win ? "Você acertou! 🎉" : "Você errou 😅") : "Resultado neutro.",
        }),
      ],
    });
  },
};
export default command;
