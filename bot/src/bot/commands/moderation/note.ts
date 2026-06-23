import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { hasModCapability } from "../../systems/moderation/moderation.permissions.js";
import { createCase } from "../../systems/moderation/cases.service.js";
import { logModerationEvent } from "../../systems/moderation/moderation.service.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("note")
    .setDescription("Adiciona uma anotação interna sobre um usuário (não envia DM).")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
    .addStringOption((o) => o.setName("texto").setDescription("Anotação").setRequired(true)),
  async execute(interaction) {
    const guild = interaction.guild!;
    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_view_history"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para anotações." })],
        flags: MessageFlags.Ephemeral,
      });
    }
    const user = interaction.options.getUser("usuario", true);
    const text = interaction.options.getString("texto", true);
    const c = await createCase({
      guildId: guild.id,
      userId: user.id,
      userTag: user.tag,
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      action: "NOTE",
      reason: text,
      source: "BOT",
    });
    await logModerationEvent({
      guildId: guild.id,
      userId: user.id,
      moderatorId: interaction.user.id,
      action: "NOTE",
      reason: text,
      details: { caseNumber: c.case_number },
    });
    await interaction.reply({
      embeds: [
        brandEmbed({
          kind: "success",
          title: `Anotação registrada · Caso #${c.case_number}`,
          description: `Sobre <@${user.id}>: ${text}`,
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default command;
