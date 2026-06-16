import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { supabase } from "../../../database/supabase.js";

const command: SlashCommand = {
  category: "level",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("toplevel")
    .setDescription("Ranking de níveis do servidor."),
  async execute(interaction) {
    if (!interaction.inGuild()) return;
    const { data } = await supabase
      .from("level_users")
      .select("user_id,username,level,total_xp")
      .eq("guild_id", interaction.guildId!)
      .order("total_xp", { ascending: false })
      .limit(10);

    const rows = data ?? [];
    await interaction.reply({
      embeds: [
        brandEmbed({
          title: "🏆 Top Níveis",
          description: rows.length
            ? rows
                .map(
                  (a, i) =>
                    `**#${i + 1}** <@${a.user_id}> — Nível **${a.level}** (${Number(a.total_xp).toLocaleString("pt-BR")} XP)`,
                )
                .join("\n")
            : "Sem dados ainda. Envie mensagens pra ganhar XP!",
        }),
      ],
    });
  },
};
export default command;
