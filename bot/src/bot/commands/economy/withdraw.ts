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
    .setName("sacar").setNameLocalizations({"en-US":"withdraw"})
    .setDescription("Saca moedas do banco.")
    .addStringOption((o) => o.setName("valor").setDescription("Quantidade ou 'all'").setRequired(true)),
  async execute(interaction) {
    const raw = interaction.options.getString("valor", true);
    const acc = await getAccount(interaction.guildId!, interaction.user.id);
    const amount = raw === "all" ? acc.bank : Math.max(0, Number(raw) | 0);
    if (!amount || amount > acc.bank) {
      await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Valor inválido" })], ephemeral: true });
      return;
    }
    acc.bank -= amount;
    acc.wallet += amount;
    await acc.save();
    const c = await getCurrency(interaction.guildId!);
    await interaction.reply({
      embeds: [brandEmbed({ kind: "success", title: "💵 Sacado", description: fmtCoins(amount, c.emoji, c.name) })],
    });
  },
};
export default command;
