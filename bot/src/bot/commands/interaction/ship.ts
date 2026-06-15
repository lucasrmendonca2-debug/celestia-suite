import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";

function pct(a: string, b: string) {
  // hash determinístico para o "casal"
  let h = 0;
  const s = [a, b].sort().join(":");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 101;
}

function bar(p: number) {
  const filled = Math.round((p / 100) * 18);
  return `${"💜".repeat(filled)}${"🤍".repeat(18 - filled)}`;
}

function shipName(a: string, b: string) {
  return a.slice(0, Math.ceil(a.length / 2)) + b.slice(Math.floor(b.length / 2));
}

const command: SlashCommand = {
  category: "interaction",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("ship")
    .setDescription("Calcula a compatibilidade entre duas pessoas.")
    .addUserOption((o) => o.setName("a").setDescription("Pessoa A").setRequired(true))
    .addUserOption((o) => o.setName("b").setDescription("Pessoa B")),
  async execute(interaction) {
    const a = interaction.options.getUser("a", true);
    const b = interaction.options.getUser("b") ?? interaction.user;
    const p = pct(a.id, b.id);
    const name = shipName(a.username, b.username);
    await interaction.reply({
      embeds: [
        brandEmbed({
          title: "💞 Shippômetro Zenox",
          description: `**${a.username}** + **${b.username}** = **${name}**\n\n${bar(p)} **${p}%**`,
        }),
      ],
    });
  },
};
export default command;
