import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";
import { pick, utilityResponses } from "../../systems/personality/index.js";

function bar(ms: number): string {
  if (ms < 100) return "🟢 Excelente";
  if (ms < 200) return "🟢 Ótimo";
  if (ms < 400) return "🟡 Normal";
  if (ms < 700) return "🟠 Lento";
  return "🔴 Crítico";
}

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
        ui.info({
          title: pick(pool),
          fields: [
            { name: "Latência da API", value: `\`${latency} ms\` · ${bar(latency)}`, inline: true },
            { name: "WebSocket", value: `\`${ws} ms\` · ${bar(ws)}`, inline: true },
          ],
        }),
      ],
    });
  },
};

export default command;
