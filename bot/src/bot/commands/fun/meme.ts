import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";

const command: SlashCommand = {
  category: "fun",
  cooldown: 3,
  data: new SlashCommandBuilder().setName("meme").setDescription("Mostra um meme aleatório."),
  async execute(interaction) {
    await interaction.deferReply();
    try {
      const res = await fetch("https://meme-api.com/gimme");
      const data = (await res.json()) as { title: string; url: string; postLink: string; subreddit: string };
      await interaction.editReply({
        embeds: [
          brandEmbed({
            title: data.title,
            image: data.url,
            footer: `r/${data.subreddit}`,
          }),
        ],
      });
    } catch {
      await interaction.editReply({ embeds: [brandEmbed({ kind: "error", title: "Sem memes agora" })] });
    }
  },
};
export default command;
