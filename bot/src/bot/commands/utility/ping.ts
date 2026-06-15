import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";

const command: SlashCommand = {
  category: "utility",
  cooldown: 3,
  data: new SlashCommandBuilder().setName("ping").setDescription("Mostra a latência do bot."),
  async execute(interaction) {
    const sent = await interaction.reply({ content: "Medindo...", fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply({
      content: null,
      embeds: [
        brandEmbed({
          kind: "info",
          title: "🏓 Pong!",
          fields: [
            { name: "Latência da API", value: `${latency} ms`, inline: true },
            { name: "WebSocket", value: `${Math.round(interaction.client.ws.ping)} ms`, inline: true },
          ],
        }),
      ],
    });
  },
};

export default command;
