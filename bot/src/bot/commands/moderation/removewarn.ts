import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import {
  deactivateWarning,
  logModerationEvent,
} from "../../systems/moderation/moderation.service.js";
import { hasModCapability } from "../../systems/moderation/moderation.permissions.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("removewarn")
    .setDescription("Remove uma advertência específica.")
    .addIntegerOption((o) => o.setName("id").setDescription("ID da advertência").setRequired(true)),
  async execute(interaction) {
    const guild = interaction.guild!;
    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_remove_warn"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para remover warns." })],
        ephemeral: true,
      });
    }
    const id = interaction.options.getInteger("id", true);
    await deactivateWarning(id, guild.id);
    await logModerationEvent({
      guildId: guild.id,
      moderatorId: interaction.user.id,
      action: "REMOVEWARN",
      details: { warningId: id },
    });
    await interaction.reply({
      embeds: [brandEmbed({ kind: "success", title: "Advertência removida", description: `\`#${id}\` foi desativada.` })],
      ephemeral: true,
    });
  },
};

export default command;
