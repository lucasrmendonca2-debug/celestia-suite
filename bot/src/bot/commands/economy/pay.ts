import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { fmtCoins } from "../../utils/format.js";
import { getAccount, getCurrency, removeWallet, addWallet } from "../../systems/economy/economy.js";
import { classifyTarget, economyResponses, pick } from "../../systems/personality/index.js";

const command: SlashCommand = {
  category: "economy",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("pay")
    .setDescription("Transfere moedas para outro membro.")
    .addUserOption((o) => o.setName("usuario").setDescription("Quem receberá").setRequired(true))
    .addIntegerOption((o) => o.setName("valor").setDescription("Quantidade").setRequired(true).setMinValue(1)),
  async execute(interaction) {
    const target = interaction.options.getUser("usuario", true);
    const amount = interaction.options.getInteger("valor", true);

    const kind = classifyTarget(interaction, target);
    if (kind === "self") {
      await interaction.reply({ embeds: [brandEmbed({ kind: "warn", description: pick(economyResponses.paySelf) })], ephemeral: true });
      return;
    }
    if (kind === "bot_self") {
      await interaction.reply({ embeds: [brandEmbed({ kind: "warn", description: pick(economyResponses.payBot) })], ephemeral: true });
      return;
    }
    if (kind === "bot_other") {
      await interaction.reply({ embeds: [brandEmbed({ kind: "warn", description: pick(economyResponses.payOtherBot) })], ephemeral: true });
      return;
    }

    const ok = await removeWallet(interaction.guildId!, interaction.user.id, amount);
    if (!ok) {
      await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Saldo insuficiente", description: pick(economyResponses.noBalance) })], ephemeral: true });
      return;
    }
    await addWallet(interaction.guildId!, target.id, amount);
    const c = await getCurrency(interaction.guildId!);
    await interaction.reply({
      embeds: [brandEmbed({ kind: "success", title: "💸 Transferência realizada", description: `${interaction.user} enviou ${fmtCoins(amount, c.emoji, c.name)} para ${target}` })],
    });
    void getAccount(interaction.guildId!, target.id);
  },
};
export default command;
