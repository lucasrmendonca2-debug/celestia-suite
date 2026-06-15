import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";

const command: SlashCommand = {
  category: "fun",
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Mostra o avatar de um usuário.")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário (padrão: você)")),
  async execute(interaction) {
    const user = interaction.options.getUser("usuario") ?? interaction.user;
    await interaction.reply({
      embeds: [brandEmbed({ title: user.tag, image: user.displayAvatarURL({ size: 1024 }) })],
    });
  },
};

export default command;
