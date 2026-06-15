import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { LevelAccount } from "../../../database/models.js";

const command: SlashCommand = {
  category: "level",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder().setName("leveltop").setDescription("Ranking de níveis."),
  async execute(interaction) {
    const top = await LevelAccount.find({ guildId: interaction.guildId! })
      .sort({ level: -1, xp: -1 })
      .limit(10);
    await interaction.reply({
      embeds: [
        brandEmbed({
          title: "🏆 Top Níveis",
          description: top.length
            ? top.map((a, i) => `**#${i + 1}** <@${a.userId}> — Nível **${a.level}** (${a.totalXp.toLocaleString("pt-BR")} XP)`).join("\n")
            : "Sem dados.",
        }),
      ],
    });
  },
};
export default command;
