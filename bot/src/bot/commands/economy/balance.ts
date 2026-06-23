import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";
import { fmtCoins } from "../../utils/format.js";
import { getAccount, getCurrency } from "../../systems/economy/economy.js";

const command: SlashCommand = {
  category: "economy",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("saldo")
    .setNameLocalizations({ "en-US": "balance" })
    .setDescription("Vê seu saldo (carteira + banco).")
    .addUserOption((o) => o.setName("usuario").setDescription("Outro usuário")),
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const target = interaction.options.getUser("usuario") ?? interaction.user;
    if (target.bot && target.id === interaction.client.user.id) {
      await interaction.reply({
        embeds: [
          ui.info({
            title: "Carteira do bot",
            description: "Eu vivo de eletricidade e boa vontade. Saldo: **0 moedas e 14 logs**.",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (target.bot) {
      await interaction.reply({
        embeds: [ui.info({ description: "Esse aí é um bot, ele não participa da economia. 🤖" })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const acc = await getAccount(guildId, target.id);
    const c = await getCurrency(guildId);
    await interaction.reply({
      embeds: [
        ui.economy({
          guildId,
          title: `Carteira de ${target.username}`,
          thumbnail: target.displayAvatarURL(),
          fields: [
            { name: "Carteira", value: fmtCoins(acc.wallet, c.emoji, c.name), inline: true },
            {
              name: "Banco",
              value: `${fmtCoins(acc.bank, c.emoji, c.name)} / ${acc.bankCap.toLocaleString("pt-BR")}`,
              inline: true,
            },
            { name: "Total", value: fmtCoins(acc.wallet + acc.bank, c.emoji, c.name), inline: true },
          ],
        }),
      ],
    });
  },
};
export default command;
