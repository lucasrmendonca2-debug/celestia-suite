import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";

const RESPOSTAS = [
  "Com certeza!", "Não conte com isso.", "Provavelmente sim.", "Pergunte mais tarde.",
  "Sem dúvidas.", "Minha resposta é não.", "Tudo aponta que sim.", "Não posso prever agora.",
  "Sinais apontam que sim.", "Não, definitivamente não.", "É melhor não te contar agora.", "Pode apostar!",
];

const command: SlashCommand = {
  category: "fun",
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Faça uma pergunta para a bola mágica 🎱.")
    .addStringOption((o) => o.setName("pergunta").setDescription("Sua pergunta").setRequired(true)),
  async execute(interaction) {
    const q = interaction.options.getString("pergunta", true);
    const r = RESPOSTAS[Math.floor(Math.random() * RESPOSTAS.length)]!;
    await interaction.reply({
      embeds: [
        ui.fun({
          guildId: interaction.guildId ?? undefined,
          title: "🎱 Bola Mágica",
          fields: [
            { name: "Pergunta", value: q },
            { name: "Resposta", value: `*${r}*` },
          ],
        }),
      ],
    });
  },
};

export default command;
