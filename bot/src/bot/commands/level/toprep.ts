import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { getTopReputation } from "../../systems/social/reputation.service.js";

const command: SlashCommand = {
  category: "level",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("toprep")
    .setDescription("Ranking de reputação do servidor."),
  async execute(interaction) {
    if (!interaction.inGuild()) return;
    const rows = await getTopReputation(interaction.guildId!, 10);
    await interaction.reply({
      embeds: [
        brandEmbed({
          title: "❤️ Top Reputação",
          description: rows.length
            ? rows.map((r, i) => `**#${i + 1}** <@${r.user_id}> — **${r.reputation}**`).join("\n")
            : "Ninguém recebeu reputação ainda.",
        }),
      ],
    });
  },
};
export default command;
