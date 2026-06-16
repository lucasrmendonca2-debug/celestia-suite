import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { hasModCapability } from "../../systems/moderation/moderation.permissions.js";
import { modStatsLast30Days } from "../../systems/moderation/cases.service.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 10,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("modstats")
    .setDescription("Estatísticas de moderação dos últimos 30 dias."),
  async execute(interaction) {
    const guild = interaction.guild!;
    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_view_history"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão." })],
        ephemeral: true,
      });
    }
    const rows = await modStatsLast30Days(guild.id);
    if (!rows.length) {
      return interaction.reply({
        embeds: [brandEmbed({ title: "📊 Modstats (30d)", description: "Nenhuma ação registrada." })],
        ephemeral: true,
      });
    }
    const byMod = new Map<string, Map<string, number>>();
    const byAction = new Map<string, number>();
    for (const r of rows) {
      const m = byMod.get(r.moderator_id) ?? new Map<string, number>();
      m.set(r.action, (m.get(r.action) ?? 0) + r.total);
      byMod.set(r.moderator_id, m);
      byAction.set(r.action, (byAction.get(r.action) ?? 0) + r.total);
    }
    const top = [...byMod.entries()]
      .map(([id, m]) => ({
        id,
        total: [...m.values()].reduce((a, b) => a + b, 0),
        breakdown: [...m.entries()].map(([k, v]) => `${k}:${v}`).join(", "),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    const actionLines = [...byAction.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `\`${k}\` — **${v}**`)
      .join("\n");

    await interaction.reply({
      embeds: [
        brandEmbed({
          title: "📊 Modstats (30d)",
          fields: [
            { name: "Por ação", value: actionLines.slice(0, 1000) },
            {
              name: "Top moderadores",
              value:
                top
                  .map((t, i) => `${i + 1}. <@${t.id}> — **${t.total}** _(${t.breakdown})_`)
                  .join("\n")
                  .slice(0, 1000) || "—",
            },
          ],
        }),
      ],
      ephemeral: true,
    });
  },
};

export default command;
