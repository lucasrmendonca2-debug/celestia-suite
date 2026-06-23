import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";
import { fmtCoins } from "../../utils/format.js";
import { bankTransferAtomic, getAccount, getCurrency } from "../../systems/economy/economy.js";

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
    if (!amount) {
      await interaction.reply({
        embeds: [ui.error({ title: "Valor inválido", description: "Informe um valor maior que zero." })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Atômico: débito bank + crédito wallet num único bloco PL/pgSQL — sem race entre 2 /sacar.
    const r = await bankTransferAtomic(guildId, interaction.user.id, amount, "withdraw");
    if (!r.ok) {
      const titles: Record<string, string> = {
        insufficient_bank: "Saldo no banco insuficiente",
        invalid_amount: "Valor inválido",
      };
      await interaction.reply({
        embeds: [ui.error({ title: titles[r.reason ?? ""] ?? "Saque falhou" })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const c = await getCurrency(guildId);
    await interaction.reply({
      embeds: [
        ui.economy({
          guildId,
          title: "Saque realizado",
          description: `Você retirou ${fmtCoins(amount, c.emoji, c.name)} do banco.`,
          fields: [
            { name: "Carteira", value: fmtCoins(r.wallet ?? 0, c.emoji, c.name), inline: true },
            { name: "Banco", value: `${fmtCoins(r.bank ?? 0, c.emoji, c.name)}${r.bankCap ? ` / ${r.bankCap.toLocaleString("pt-BR")}` : ""}`, inline: true },
          ],
        }),
      ],
    });
  },
};
export default command;
