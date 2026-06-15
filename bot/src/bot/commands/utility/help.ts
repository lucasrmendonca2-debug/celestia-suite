import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";

const CATEGORIES = [
  { key: "moderation", label: "🛡️ Moderação" },
  { key: "tickets", label: "🎫 Tickets" },
  { key: "vip", label: "💎 VIP" },
  { key: "economy", label: "💰 Economia" },
  { key: "level", label: "📈 Level" },
  { key: "fun", label: "🎉 Diversão" },
  { key: "utility", label: "🧰 Utilidades" },
  { key: "config", label: "⚙️ Configuração" },
  { key: "admin", label: "👑 Admin" },
] as const;

const command: SlashCommand = {
  category: "utility",
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Lista os comandos disponíveis por categoria.")
    .addStringOption((o) =>
      o
        .setName("categoria")
        .setDescription("Categoria específica")
        .addChoices(...CATEGORIES.map((c) => ({ name: c.label, value: c.key }))),
    ),
  async execute(interaction, { client }) {
    const cat = interaction.options.getString("categoria");
    if (!cat) {
      await interaction.reply({
        embeds: [
          brandEmbed({
            title: "Central de Ajuda",
            description: "Use `/help categoria:<nome>` para ver comandos específicos.",
            fields: CATEGORIES.map((c) => {
              const list = client.commands.filter((cmd) => cmd.category === c.key).map((cmd) => `\`/${cmd.data.name}\``);
              return { name: c.label, value: list.length ? list.join(" ") : "—" };
            }),
          }),
        ],
        ephemeral: true,
      });
      return;
    }
    const cmds = client.commands.filter((cmd) => cmd.category === cat);
    await interaction.reply({
      embeds: [
        brandEmbed({
          title: `Comandos — ${CATEGORIES.find((c) => c.key === cat)?.label ?? cat}`,
          description: cmds.size
            ? cmds.map((c) => `**/${c.data.name}** — ${c.data.description}`).join("\n")
            : "Nenhum comando nesta categoria ainda.",
        }),
      ],
      ephemeral: true,
    });
  },
};

export default command;
