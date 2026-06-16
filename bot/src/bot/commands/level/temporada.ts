import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { getActiveSeason, getSeasonLeaderboard } from "../../systems/social/season.service.js";

const command: SlashCommand = {
  category: "level",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("temporada")
    .setDescription("Veja informações da temporada de XP ativa.")
    .addSubcommand((s) => s.setName("info").setDescription("Detalhes da temporada atual."))
    .addSubcommand((s) =>
      s.setName("top").setDescription("Top 10 da temporada atual."),
    ),

  async execute(interaction) {
    if (!interaction.inGuild()) return;
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    const season = await getActiveSeason(guildId);

    if (!season) {
      await interaction.reply({
        ephemeral: true,
        content: "Nenhuma temporada ativa no momento.",
      });
      return;
    }

    if (sub === "info") {
      const ends = season.ends_at ? `<t:${Math.floor(new Date(season.ends_at).getTime() / 1000)}:R>` : "Sem data fim";
      await interaction.reply({
        embeds: [
          brandEmbed({
            title: `🏆 Temporada · ${season.name}`,
            description: season.description || "_Sem descrição._",
            fields: [
              { name: "Multiplicador XP", value: `×${Number(season.xp_multiplier).toFixed(2)}`, inline: true },
              { name: "Termina", value: ends, inline: true },
            ],
          }),
        ],
      });
      return;
    }

    if (sub === "top") {
      const rows = await getSeasonLeaderboard(season.id, 10);
      if (rows.length === 0) {
        await interaction.reply({ ephemeral: true, content: "Ninguém pontuou ainda nesta temporada." });
        return;
      }
      const medals = ["🥇", "🥈", "🥉"];
      const list = rows
        .map((r, i) => `${medals[i] ?? `**#${i + 1}**`} <@${r.user_id}> — **${r.xp.toLocaleString("pt-BR")} XP** · Nv. ${r.level}`)
        .join("\n");
      await interaction.reply({
        embeds: [brandEmbed({ title: `🏆 Top — ${season.name}`, description: list })],
      });
      return;
    }
  },
};

export default command;
