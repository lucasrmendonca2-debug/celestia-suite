import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from "discord.js";
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
  botPermissions: [PermissionFlagsBits.BanMembers],
  data: new SlashCommandBuilder()
    .setName("tempban")
    .setDescription("Bane temporariamente (desbanimento automático).")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
    .addStringOption((o) =>
      o.setName("duracao").setDescription("Ex: 1h, 2d, 1w").setRequired(true),
    )
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo")),
  async execute(interaction) {
    const guild = interaction.guild!;
    const config = await getModerationConfig(guild.id);
    if (!config.enabled || !config.allow_temporary_ban) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Tempban desativado nas configurações." })],
        flags: MessageFlags.Ephemeral,
      });
    }
    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_ban"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para banir." })],
        flags: MessageFlags.Ephemeral,
      });
    }
    const user = interaction.options.getUser("usuario", true);
    const reason = interaction.options.getString("motivo") ?? undefined;
    const duration = parseDurationSeconds(interaction.options.getString("duracao", true));
    if (!duration) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Duração inválida (use 1h, 2d, 1w)." })],
        flags: MessageFlags.Ephemeral,
      });
    }
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (member) {
      const check = await canPunishTarget(author, member, config);
      if (!check.ok) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Não posso punir", description: check.reason })],
          flags: MessageFlags.Ephemeral,
        });
      }
      if (!member.bannable) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Não consigo banir esse usuário." })],
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    await interaction.deferReply();
    const expiresAt = new Date(Date.now() + duration * 1000);
    const c = await createCase({
      guildId: guild.id,
      userId: user.id,
      userTag: user.tag,
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      action: "TEMP_BAN",
      reason,
      durationSeconds: duration,
      expiresAt,
      source: "BOT",
    });
    await dmPunishedUser({
      guild,
      type: "TEMP_BAN",
      target: user,
      moderator: interaction.user,
      reason,
      durationSeconds: duration,
      config,
      caseNumber: c.case_number,
    });
    await guild.bans.create(user.id, {
      reason: `[${interaction.user.tag}] ${reason ?? "Tempban"}`,
      deleteMessageSeconds: 0,
    });
    const p = await createPunishment({
      guildId: guild.id,
      userId: user.id,
      username: user.tag,
      moderatorId: interaction.user.id,
      moderatorName: interaction.user.tag,
      type: "TEMP_BAN",
      reason,
      durationSeconds: duration,
    });
    await scheduleTemporaryAction({
      guildId: guild.id,
      userId: user.id,
      actionType: "TEMP_BAN",
      expiresAt,
      punishmentId: p.id as number,
    });
    await logModerationEvent({
      guildId: guild.id,
      userId: user.id,
      moderatorId: interaction.user.id,
      action: "TEMP_BAN",
      reason,
      details: { caseNumber: c.case_number, duration },
    });
    await postModerationLog({
      guild,
      type: "TEMP_BAN",
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
          title: `Tempban aplicado · Caso #${c.case_number}`,
          description: `<@${user.id}> liberado <t:${Math.floor(expiresAt.getTime() / 1000)}:R>.`,
        }),
      ],
    });
  },
};

export default command;
