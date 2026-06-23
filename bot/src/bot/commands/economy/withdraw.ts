import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";
import { fmtCoins } from "../../utils/format.js";
import { getAccount, getCurrency } from "../../systems/economy/economy.js";

const command: SlashCommand = {
  category: "economy",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("sacar")
    .setNameLocalizations({ "en-US": "withdraw" })
    .setDescription("Saca moedas do banco.")
    .addStringOption((o) => o.setName("valor").setDescription("Quantidade ou 'all'").setRequired(true)),
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const raw = interaction.options.getString("valor", true);
    const acc = await getAccount(guildId, interaction.user.id);
    const amount = raw === "all" ? acc.bank : Math.max(0, Number(raw) | 0);
    if (!amount || amount > acc.bank) {
      await interaction.reply({
        embeds: [ui.error({ title: "Valor inválido", description: "Você não tem esse valor disponível no banco." })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    acc.bank -= amount;
    acc.wallet += amount;
    await acc.save();
    const c = await getCurrency(guildId);
    await interaction.reply({
      embeds: [
        ui.economy({
          guildId,
          title: "Saque realizado",
          description: `Você retirou ${fmtCoins(amount, c.emoji, c.name)} do banco.`,
          fields: [
            { name: "Carteira", value: fmtCoins(acc.wallet, c.emoji, c.name), inline: true },
            { name: "Banco", value: `${fmtCoins(acc.bank, c.emoji, c.name)} / ${acc.bankCap.toLocaleString("pt-BR")}`, inline: true },
          ],
        }),
      ],
    });
  },
};
export default command;
