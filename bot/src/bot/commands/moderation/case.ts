import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { hasModCapability } from "../../systems/moderation/moderation.permissions.js";
import { getCase } from "../../systems/moderation/cases.service.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("case")
    .setDescription("Mostra os detalhes de um caso de moderação.")
    .addIntegerOption((o) => o.setName("numero").setDescription("Número do caso").setRequired(true).setMinValue(1)),
  async execute(interaction) {
    const guild = interaction.guild!;
    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_view_history"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para ver histórico." })],
        flags: MessageFlags.Ephemeral,
      });
    }
    const n = interaction.options.getInteger("numero", true);
    const c = await getCase(guild.id, n);
    if (!c) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: `Caso #${n} não encontrado.` })],
        flags: MessageFlags.Ephemeral,
      });
    }
    const fields: { name: string; value: string; inline?: boolean }[] = [
      { name: "Ação", value: c.action, inline: true },
      { name: "Status", value: c.active ? "🟢 Ativo" : "⚪ Inativo", inline: true },
      { name: "Origem", value: c.source, inline: true },
      { name: "Usuário", value: `<@${c.user_id}>\n\`${c.user_tag ?? c.user_id}\``, inline: true },
      { name: "Moderador", value: `<@${c.moderator_id}>`, inline: true },
      { name: "Criado", value: `<t:${Math.floor(new Date(c.created_at).getTime() / 1000)}:F>`, inline: true },
    ];
    if (c.severity) fields.push({ name: "Severidade", value: c.severity, inline: true });
    if (c.duration_seconds)
      fields.push({ name: "Duração (s)", value: String(c.duration_seconds), inline: true });
    if (c.expires_at)
      fields.push({
        name: "Expira",
        value: `<t:${Math.floor(new Date(c.expires_at).getTime() / 1000)}:R>`,
        inline: true,
      });
    if (c.edited_at)
      fields.push({
        name: "Editado",
        value: `<t:${Math.floor(new Date(c.edited_at).getTime() / 1000)}:R> por <@${c.edited_by}>`,
      });
    fields.push({ name: "Motivo", value: c.reason || "Sem motivo informado." });
    if (c.proof_url) fields.push({ name: "Prova", value: c.proof_url });

    await interaction.reply({
      embeds: [brandEmbed({ title: `Caso #${c.case_number}`, fields })],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default command;
