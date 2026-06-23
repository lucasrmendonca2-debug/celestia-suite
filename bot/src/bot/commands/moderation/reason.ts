import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { hasModCapability } from "../../systems/moderation/moderation.permissions.js";
import { editCaseReason, getCase } from "../../systems/moderation/cases.service.js";
import { logModerationEvent } from "../../systems/moderation/moderation.service.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("reason")
    .setDescription("Edita o motivo de um caso de moderação.")
    .addIntegerOption((o) => o.setName("numero").setDescription("Número do caso").setRequired(true).setMinValue(1))
    .addStringOption((o) => o.setName("motivo").setDescription("Novo motivo").setRequired(true)),
  async execute(interaction) {
    const guild = interaction.guild!;
    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_view_history"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para editar casos." })],
        flags: MessageFlags.Ephemeral,
      });
    }
    const n = interaction.options.getInteger("numero", true);
    const motivo = interaction.options.getString("motivo", true);
    const existing = await getCase(guild.id, n);
    if (!existing) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: `Caso #${n} não encontrado.` })],
        flags: MessageFlags.Ephemeral,
      });
    }
    const updated = await editCaseReason({
      guildId: guild.id,
      caseNumber: n,
      reason: motivo,
      editorId: interaction.user.id,
    });
    await logModerationEvent({
      guildId: guild.id,
      moderatorId: interaction.user.id,
      action: "REASON_EDIT",
      details: { caseNumber: n, oldReason: existing.reason, newReason: motivo },
    });
    await interaction.reply({
      embeds: [
        brandEmbed({
          kind: "success",
          title: `Caso #${n} atualizado`,
          fields: [
            { name: "Antes", value: existing.reason || "_(vazio)_" },
            { name: "Agora", value: updated?.reason ?? motivo },
          ],
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default command;
