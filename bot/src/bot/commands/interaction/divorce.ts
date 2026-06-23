import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { Marriage } from "../../../database/models.js";

const command: SlashCommand = {
  category: "interaction",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("divorciar")
    .setNameLocalizations({ "en-US": "divorce" })
    .setDescription("Termina seu casamento 💔"),
  async execute(interaction) {
    const m = await Marriage.findOne({
      status: "MARRIED",
      $or: [{ userA: interaction.user.id }, { userB: interaction.user.id }],
    });
    if (!m) {
      await interaction.reply({ embeds: [brandEmbed({ kind: "warn", title: "Você não é casado(a)" })], flags: MessageFlags.Ephemeral });
      return;
    }
    m.status = "DIVORCED";
    await m.save();
    const other = m.userA === interaction.user.id ? m.userB : m.userA;
    await interaction.reply({
      embeds: [brandEmbed({ kind: "warn", title: "💔 Divorciado", description: `Você se divorciou de <@${other}>.` })],
    });
  },
};
export default command;
