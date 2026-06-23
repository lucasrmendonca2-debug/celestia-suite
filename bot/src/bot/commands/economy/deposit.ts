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
    .setName("depositar")
    .setNameLocalizations({ "en-US": "deposit" })
    .setDescription("Deposita moedas no banco.")
    .addStringOption((o) => o.setName("valor").setDescription("Quantidade ou 'all'").setRequired(true)),
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const raw = interaction.options.getString("valor", true);
    const acc = await getAccount(guildId, interaction.user.id);
    const max = Math.max(0, acc.bankCap - acc.bank);
    const parsed = raw === "all" ? Math.min(acc.wallet, max) : Math.trunc(Number(raw));
    const amount = Number.isFinite(parsed) && parsed > 0 ? Math.max(0, parsed) : 0;
    if (!amount || amount > acc.wallet) {
      await interaction.reply({
        embeds: [ui.error({ title: "Valor inválido", description: "Verifique seu saldo na carteira e tente novamente." })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (amount > max) {
      await interaction.reply({
        embeds: [
          ui.warn({
            title: "Banco cheio",
            description: `Você só pode depositar mais **${max.toLocaleString("pt-BR")}** agora.`,
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    acc.wallet -= amount;
    acc.bank += amount;
    await acc.save();
    const c = await getCurrency(guildId);
    await interaction.reply({
      embeds: [
        ui.economy({
          guildId,
          title: "Depósito realizado",
          description: `Você guardou ${fmtCoins(amount, c.emoji, c.name)} no banco.`,
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
