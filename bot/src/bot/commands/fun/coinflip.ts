import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";

const command: SlashCommand = {
  category: "fun",
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName("moeda")
    .setNameLocalizations({ "en-US": "coinflip" })
    .setDescription("Joga uma moeda — cara ou coroa.")
    .addStringOption((o) =>
      o
        .setName("aposta")
        .setDescription("cara ou coroa")
        .addChoices({ name: "Cara", value: "cara" }, { name: "Coroa", value: "coroa" }),
    ),
  async execute(interaction) {
    const guess = interaction.options.getString("aposta");
    const result = Math.random() < 0.5 ? "cara" : "coroa";
    const win = guess && guess === result;
    const variant = guess ? (win ? ui.success : ui.error) : ui.fun;
    await interaction.reply({
      embeds: [
        variant({
          title: `🪙 ${result.toUpperCase()}!`,
          description: guess
            ? win
              ? "Você acertou! 🎉"
              : "Você errou 😅 Tente de novo."
            : "Resultado neutro — sem aposta.",
        }),
      ],
    });
  },
};
export default command;
