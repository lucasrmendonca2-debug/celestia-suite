import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { findActiveMarriage, breakMarriage } from "../../repositories/phase4.repo.js";

const command: SlashCommand = {
  category: "interaction",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("divorciar")
    .setNameLocalizations({ "en-US": "divorce" })
    .setDescription("Termina seu casamento 💔"),
  async execute(interaction) {
    const m = await findActiveMarriage(interaction.guildId!, [interaction.user.id]);
    if (!m) {
      await interaction.reply({ embeds: [brandEmbed({ kind: "warn", title: "Você não é casado(a)" })], flags: MessageFlags.Ephemeral });
      return;
    }
    await breakMarriage(m.id);
    const other = m.user_a_id === interaction.user.id ? m.user_b_id : m.user_a_id;
    await interaction.reply({
      embeds: [brandEmbed({ kind: "warn", title: "💔 Divorciado", description: `Você se divorciou de <@${other}>.` })],
    });
  },
};
export default command;
