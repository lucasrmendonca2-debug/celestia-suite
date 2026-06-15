import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { fmtCoins } from "../../utils/format.js";
import { getAccount, getCurrency } from "../../systems/economy/economy.js";

const command: SlashCommand = {
  category: "economy",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("Deposita moedas no banco.")
    .addStringOption((o) => o.setName("valor").setDescription("Quantidade ou 'all'").setRequired(true)),
  async execute(interaction) {
    const raw = interaction.options.getString("valor", true);
    const acc = await getAccount(interaction.guildId!, interaction.user.id);
    const max = Math.max(0, acc.bankCap - acc.bank);
    const amount = raw === "all" ? Math.min(acc.wallet, max) : Math.max(0, Number(raw) | 0);
    if (!amount || amount > acc.wallet) {
      await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Valor inválido" })], ephemeral: true });
      return;
    }
    if (amount > max) {
      await interaction.reply({ embeds: [brandEmbed({ kind: "warn", title: "Banco cheio", description: `Você só pode depositar mais ${max.toLocaleString("pt-BR")}.` })], ephemeral: true });
      return;
    }
    acc.wallet -= amount;
    acc.bank += amount;
    await acc.save();
    const c = await getCurrency(interaction.guildId!);
    await interaction.reply({
      embeds: [brandEmbed({ kind: "success", title: "🏦 Depositado", description: fmtCoins(amount, c.emoji, c.name) })],
    });
  },
};
export default command;
