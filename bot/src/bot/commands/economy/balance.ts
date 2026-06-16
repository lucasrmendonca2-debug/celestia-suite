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
    .setName("saldo").setNameLocalizations({"en-US":"balance"})
    .setDescription("Vê seu saldo (carteira + banco).")
    .addUserOption((o) => o.setName("usuario").setDescription("Outro usuário")),
  async execute(interaction) {
    const target = interaction.options.getUser("usuario") ?? interaction.user;
    if (target.bot && target.id === interaction.client.user.id) {
      await interaction.reply({
        embeds: [brandEmbed({ kind: "info", title: "🤖 Carteira do bot", description: "Eu vivo de eletricidade e boa vontade. Saldo: **0 moedas e 14 logs**." })],
        ephemeral: true,
      });
      return;
    }
    if (target.bot) {
      await interaction.reply({ embeds: [brandEmbed({ kind: "info", description: "Esse aí é um bot. Ele não usa economia. 🤖" })], ephemeral: true });
      return;
    }
    const acc = await getAccount(interaction.guildId!, target.id);
    const c = await getCurrency(interaction.guildId!);
    await interaction.reply({
      embeds: [
        brandEmbed({
          title: `💼 Carteira de ${target.username}`,
          fields: [
            { name: "Carteira", value: fmtCoins(acc.wallet, c.emoji, c.name), inline: true },
            { name: "Banco", value: `${fmtCoins(acc.bank, c.emoji, c.name)} / ${acc.bankCap.toLocaleString("pt-BR")}`, inline: true },
            { name: "Total", value: fmtCoins(acc.wallet + acc.bank, c.emoji, c.name), inline: true },
          ],
          thumbnail: target.displayAvatarURL(),
        }),
      ],
    });
  },
};
export default command;
