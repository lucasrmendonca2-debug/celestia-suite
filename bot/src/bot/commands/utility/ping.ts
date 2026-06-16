import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { pick, utilityResponses } from "../../systems/personality/index.js";

const command: SlashCommand = {
  category: "utility",
  cooldown: 3,
  data: new SlashCommandBuilder().setName("ping").setDescription("Mostra a latência do bot."),
  async execute(interaction) {
    const sent = await interaction.reply({ content: "🏓 Medindo...", fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const ws = Math.round(interaction.client.ws.ping);
    const worst = Math.max(latency, ws);
    const pool =
      worst < 150 ? utilityResponses.pingFast : worst < 400 ? utilityResponses.pingNormal : utilityResponses.pingSlow;
    await interaction.editReply({
      content: null,
      embeds: [
        brandEmbed({
          kind: "info",
          title: pick(pool),
          fields: [
            { name: "Latência da API", value: `${latency} ms`, inline: true },
            { name: "WebSocket", value: `${ws} ms`, inline: true },
          ],
        }),
      ],
    });
  },
};

export default command;
