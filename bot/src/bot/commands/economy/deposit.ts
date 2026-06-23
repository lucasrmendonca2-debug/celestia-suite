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
    .setName("depositar")
    .setNameLocalizations({ "en-US": "deposit" })
    .setDescription("Deposita moedas no banco.")
    .addStringOption((o) => o.setName("valor").setDescription("Quantidade ou 'all'").setRequired(true)),
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const raw = interaction.options.getString("valor", true);
    const acc = await getAccount(guildId, interaction.user.id);
    const maxRoom = Math.max(0, acc.bankCap - acc.bank);
    const parsed = raw === "all" ? Math.min(acc.wallet, maxRoom) : Math.trunc(Number(raw));
    const amount = Number.isFinite(parsed) && parsed > 0 ? Math.max(0, parsed) : 0;
    if (!amount) {
      await interaction.reply({
        embeds: [ui.error({ title: "Valor inválido", description: "Verifique seu saldo na carteira e tente novamente." })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Atômico: débito wallet + crédito bank num único bloco PL/pgSQL — sem race entre 2 /depositar.
    const r = await bankTransferAtomic(guildId, interaction.user.id, amount, "deposit");
    if (!r.ok) {
      const titles: Record<string, string> = {
        insufficient_funds: "Saldo insuficiente",
        bank_cap_exceeded: "Banco cheio",
        invalid_amount: "Valor inválido",
      };
      await interaction.reply({
        embeds: [ui.error({ title: titles[r.reason ?? ""] ?? "Depósito falhou" })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const c = await getCurrency(guildId);
    await interaction.reply({
      embeds: [
        ui.economy({
          guildId,
          title: "Depósito realizado",
          description: `Você guardou ${fmtCoins(amount, c.emoji, c.name)} no banco.`,
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
