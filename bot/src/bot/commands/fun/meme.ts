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
      const safeUrl = typeof data?.url === "string" && /^https?:\/\//i.test(data.url) ? data.url : undefined;
      await interaction.editReply({
        embeds: [
          brandEmbed({
            title: (data?.title ?? "Meme").slice(0, 256),
            image: safeUrl,
            footer: data?.subreddit ? `r/${data.subreddit}` : undefined,
          }),
        ],
      });
    } catch {
      await interaction.editReply({ embeds: [brandEmbed({ kind: "error", title: "Sem memes agora" })] });
    }
  },
};
export default command;
