import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { fmtCoins } from "../../utils/format.js";
import { getAccount, getCurrency } from "../../systems/economy/economy.js";
import { EconomyAccount } from "../../../database/models.js";

const DAY = 24 * 3600 * 1000;
const WEEK = 7 * DAY;

const command: SlashCommand = {
  category: "economy",
  module: "economia",
  cooldown: 4,
  guildOnly: true,
  enabledByDefault: true,
  dashboardConfigurable: true,
  longDescription: "Hub de economia: veja sua streak de diária, rankings semanal e total.",
  examples: ["/economia streak", "/economia rank periodo:semanal", "/economia historico"],
  data: new SlashCommandBuilder()
    .setName("economia")
    .setDescription("Hub de economia: streak, rankings e histórico.")
    .addSubcommand((s) => s.setName("streak").setDescription("Mostra sua streak de daily."))
    .addSubcommand((s) =>
      s
        .setName("rank")
        .setDescription("Ranking de riqueza do servidor.")
        .addStringOption((o) =>
          o
            .setName("periodo")
            .setDescription("Período do ranking")
            .addChoices({ name: "Total", value: "total" }, { name: "Semanal", value: "semanal" }),
        ),
    )
    .addSubcommand((s) => s.setName("historico").setDescription("Histórico recente da sua economia (em breve).")),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    const c = await getCurrency(guildId);

    if (sub === "streak") {
      const acc = await getAccount(guildId, interaction.user.id);
      const next = acc.lastDaily ? acc.lastDaily.getTime() + DAY : Date.now();
      const status = !acc.lastDaily || Date.now() >= next
        ? "✅ Disponível agora — use `/daily` pra continuar a streak."
        : `⏳ Próxima daily <t:${Math.floor(next / 1000)}:R>`;
      return interaction.reply({
        embeds: [
          brandEmbed({
            title: "🔥 Streak de Daily",
            description: [
              `**${acc.streakDaily ?? 0}** dia(s) consecutivos`,
              `Bônus atual: +${Math.min(acc.streakDaily ?? 0, 7) * 50} ${c.emoji}`,
              "",
              status,
            ].join("\n"),
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "rank") {
      const period = interaction.options.getString("periodo") ?? "total";
      const filter: Record<string, unknown> = { guildId };
      if (period === "semanal") filter.updatedAt = { $gte: new Date(Date.now() - WEEK) };
      const top = await EconomyAccount.find(filter as any)
        .sort({ wallet: -1, bank: -1 })
        .limit(10)
        .lean();
      const lines = top.length
        ? top
            .map((u: any, i: number) => `**${i + 1}.** <@${u.userId}> — ${fmtCoins((u.wallet ?? 0) + (u.bank ?? 0), c.emoji, c.name)}`)
            .join("\n")
        : "Ninguém no ranking ainda.";
      return interaction.reply({
        embeds: [
          brandEmbed({
            title: period === "semanal" ? "📅 Ranking semanal" : "🏆 Ranking total",
            description: lines,
            footer: period === "semanal" ? "Considera contas com atividade nos últimos 7 dias" : "Riqueza total (carteira + banco)",
          }),
        ],
      });
    }

    if (sub === "historico") {
      const { listTx } = await import("../../systems/economy/economy.tx.js");
      const rows = await listTx(guildId, interaction.user.id, 15);
      const lines =
        rows
          .map((r: any) => {
            const sign = r.amount >= 0 ? "+" : "";
            const ts = `<t:${Math.floor(new Date(r.created_at).getTime() / 1000)}:R>`;
            return `\`${r.kind.padEnd(14)}\` ${sign}${r.amount} ${c.emoji} · ${r.reason ?? "—"} · ${ts}`;
          })
          .join("\n") || "_Nenhuma transação registrada ainda._";
      return interaction.reply({
        embeds: [
          brandEmbed({
            title: "📜 Histórico de transações",
            description: lines,
            footer: "Últimas 15 transações",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default command;
