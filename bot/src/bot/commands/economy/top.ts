import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";
import { getAsset } from "../../systems/ui/embed.assets.js";
import { fmtCoins } from "../../utils/format.js";
import { EconomyAccount } from "../../../database/models.js";
import { getCurrency } from "../../systems/economy/economy.js";

const MEDALS = ["🥇", "🥈", "🥉"];

const command: SlashCommand = {
  category: "economy",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("ranking")
    .setNameLocalizations({ "en-US": "top" })
    .setDescription("Ranking de riqueza do servidor."),
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const top = await EconomyAccount.find({ guildId })
      .sort({ wallet: -1, bank: -1 })
      .limit(10);
    const c = await getCurrency(guildId);
    const image = await getAsset(guildId, "economy.top_image");

    await interaction.reply({
      embeds: [
        ui.economy({
          guildId,
          title: "Top Riqueza do servidor",
          description: top.length
            ? top
                .map((a, i) => {
                  const prefix = MEDALS[i] ?? `**#${i + 1}**`;
                  return `${prefix} <@${a.userId}> — ${fmtCoins(a.wallet + a.bank, c.emoji, c.name)}`;
                })
                .join("\n")
            : "Ninguém no ranking ainda. Use `/daily` e `/trabalhar` para começar.",
          image,
        }),
      ],
    });
  },
};
export default command;
