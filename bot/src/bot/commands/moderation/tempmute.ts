import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import {
  createPunishment,
  getModerationConfig,
  logModerationEvent,
  scheduleTemporaryAction,
} from "../../systems/moderation/moderation.service.js";
import {
  canPunishTarget,
  hasModCapability,
} from "../../systems/moderation/moderation.permissions.js";
import {
  dmPunishedUser,
  parseDurationSeconds,
  postModerationLog,
} from "../../systems/moderation/moderation.logger.js";
import { createCase } from "../../systems/moderation/cases.service.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  botPermissions: [PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.ManageRoles],
  data: new SlashCommandBuilder()
    .setName("tempmute")
    .setDescription("Silencia temporariamente (atalho para /mute com duração).")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
    .addStringOption((o) =>
      o.setName("duracao").setDescription("Ex: 10m, 1h, 1d").setRequired(true),
    )
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo")),
  async execute(interaction) {
    const guild = interaction.guild!;
    const config = await getModerationConfig(guild.id);
    if (!config.enabled || !config.allow_temporary_mute) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Tempmute desativado nas configurações." })],
        ephemeral: true,
      });
    }
    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_mute"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para mutar." })],
        ephemeral: true,
      });
    }
    const user = interaction.options.getUser("usuario", true);
    const reason = interaction.options.getString("motivo") ?? undefined;
    const duration = parseDurationSeconds(interaction.options.getString("duracao", true));
    if (!duration) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Duração inválida (use 10m, 1h, 1d)." })],
        ephemeral: true,
      });
    }
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Usuário não está no servidor." })],
        ephemeral: true,
      });
    }
    const check = await canPunishTarget(author, member, config);
    if (!check.ok) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Não posso punir", description: check.reason })],
        ephemeral: true,
      });
    }
    await interaction.deferReply();
    const expiresAt = new Date(Date.now() + duration * 1000);
    const c = await createCase({
      guildId: guild.id,
      userId: user.id,
      userTag: user.tag,
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      action: "TEMP_MUTE",
      reason,
      durationSeconds: duration,
      expiresAt,
      source: "BOT",
    });
    await dmPunishedUser({
      guild,
      type: "TEMP_MUTE",
      target: user,
      moderator: interaction.user,
      reason,
      durationSeconds: duration,
      config,
      caseNumber: c.case_number,
    });
    if (config.mute_role_id) {
      await member.roles.add(config.mute_role_id, `[${interaction.user.tag}] tempmute`);
    } else if (member.moderatable) {
      await member.timeout(Math.min(duration, 28 * 86400) * 1000, `[${interaction.user.tag}] tempmute`);
    } else {
      return interaction.editReply({
        embeds: [brandEmbed({ kind: "error", title: "Não consigo silenciar (hierarquia) e não há cargo de mute configurado." })],
      });
    }
    const p = await createPunishment({
      guildId: guild.id,
      userId: user.id,
      username: user.tag,
      moderatorId: interaction.user.id,
      moderatorName: interaction.user.tag,
      type: "TEMP_MUTE",
      reason,
      durationSeconds: duration,
    });
    await scheduleTemporaryAction({
      guildId: guild.id,
      userId: user.id,
      actionType: "TEMP_MUTE",
      expiresAt,
      punishmentId: p.id as number,
    });
    await logModerationEvent({
      guildId: guild.id,
      userId: user.id,
      moderatorId: interaction.user.id,
      action: "TEMP_MUTE",
      reason,
      details: { caseNumber: c.case_number, duration },
    });
    await postModerationLog({
      guild,
      type: "TEMP_MUTE",
      target: user,
      moderator: interaction.user,
      reason,
      durationSeconds: duration,
      config,
      caseNumber: c.case_number,
    });
    await interaction.editReply({
      embeds: [
        brandEmbed({
          kind: "success",
          title: `Mute temporário · Caso #${c.case_number}`,
          description: `<@${user.id}> liberado <t:${Math.floor(expiresAt.getTime() / 1000)}:R>.`,
        }),
      ],
    });
  },
};

export default command;
