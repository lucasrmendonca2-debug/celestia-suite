import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";
import { fmtCoins } from "../../utils/format.js";
import { getAccount, getCurrency, transferWallet } from "../../systems/economy/economy.js";
import { classifyTarget, economyResponses, pick } from "../../systems/personality/index.js";

const command: SlashCommand = {
  category: "economy",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("pagar")
    .setNameLocalizations({ "en-US": "pay" })
    .setDescription("Transfere moedas para outro membro.")
    .addUserOption((o) => o.setName("usuario").setDescription("Quem receberá").setRequired(true))
    .addIntegerOption((o) => o.setName("valor").setDescription("Quantidade").setRequired(true).setMinValue(1)),
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const target = interaction.options.getUser("usuario", true);
    const amount = interaction.options.getInteger("valor", true);

    const kind = classifyTarget(interaction, target);
    if (kind === "self") {
      await interaction.reply({ embeds: [ui.warn({ description: pick(economyResponses.paySelf) })], ephemeral: true });
      return;
    }
    if (kind === "bot_self") {
      await interaction.reply({ embeds: [ui.warn({ description: pick(economyResponses.payBot) })], ephemeral: true });
      return;
    }
    if (kind === "bot_other") {
      await interaction.reply({ embeds: [ui.warn({ description: pick(economyResponses.payOtherBot) })], ephemeral: true });
      return;
    }

    const tx = await transferWallet(guildId, interaction.user.id, target.id, amount);
    if (!tx.ok) {
      const description =
        tx.reason === "insufficient_funds" ? pick(economyResponses.noBalance) : "Não foi possível concluir a transferência agora.";
      await interaction.reply({
        embeds: [ui.error({ title: "Saldo insuficiente", description })],
        ephemeral: true,
      });
      return;
    }
    const c = await getCurrency(guildId);
    await interaction.reply({
      embeds: [
        ui.economy({
          guildId,
          title: "Transferência realizada",
          description: `${interaction.user} enviou ${fmtCoins(amount, c.emoji, c.name)} para ${target}.`,
        }),
      ],
    });
    void getAccount(guildId, target.id);
  },
};
export default command;
