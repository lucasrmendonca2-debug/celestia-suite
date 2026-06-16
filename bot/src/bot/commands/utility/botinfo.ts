import { SlashCommandBuilder, version as djsVersion } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";

function fmtUptime(ms: number) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

const command: SlashCommand = {
  category: "utility",
  cooldown: 5,
  data: new SlashCommandBuilder().setName("botinfo").setDescription("Informações sobre o Zenox."),
  async execute(interaction, { client }) {
    const guilds = client.guilds.cache.size;
    const users = client.users.cache.size;
    const mem = process.memoryUsage().heapUsed / 1024 / 1024;
    await interaction.reply({
      embeds: [
        brandEmbed({
          title: "🤖 Zenox",
          description: "Bot modular pra Discord — moderação, economia, level, tickets, sorteios, enquetes e mais.",
          fields: [
            { name: "Servidores", value: String(guilds), inline: true },
            { name: "Usuários (cache)", value: String(users), inline: true },
            { name: "Uptime", value: fmtUptime(client.uptime ?? 0), inline: true },
            { name: "WebSocket", value: `${Math.round(client.ws.ping)} ms`, inline: true },
            { name: "Memória", value: `${mem.toFixed(1)} MB`, inline: true },
            { name: "discord.js", value: `v${djsVersion}`, inline: true },
            { name: "Node", value: process.version, inline: true },
          ],
        }),
      ],
      ephemeral: true,
    });
  },
};

export default command;
