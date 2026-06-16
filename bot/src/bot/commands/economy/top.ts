import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { fmtCoins } from "../../utils/format.js";
import { EconomyAccount } from "../../../database/models.js";
import { getCurrency } from "../../systems/economy/economy.js";

const command: SlashCommand = {
  category: "economy",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder().setName("ranking").setNameLocalizations({"en-US":"top"}).setDescription("Ranking de riqueza do servidor."),
  async execute(interaction) {
    const top = await EconomyAccount.find({ guildId: interaction.guildId! })
      .sort({ wallet: -1, bank: -1 })
      .limit(10);
    const c = await getCurrency(interaction.guildId!);
    await interaction.reply({
      embeds: [
        brandEmbed({
          title: "🏆 Top Riqueza",
          description: top.length
            ? top
                .map((a, i) => `**#${i + 1}** <@${a.userId}> — ${fmtCoins(a.wallet + a.bank, c.emoji, c.name)}`)
                .join("\n")
            : "Ninguém no ranking ainda.",
        }),
      ],
    });
  },
};
export default command;
