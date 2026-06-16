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

const MAX_TIMEOUT = 28 * 24 * 60 * 60;

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  botPermissions: [PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.ManageRoles],
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Silencia um usuário (timeout ou cargo de mute).")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
    .addStringOption((o) =>
      o.setName("duracao").setDescription("Ex.: 10m, 1h, 1d (vazio = padrão do servidor)"),
    )
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo")),
  async execute(interaction) {
    const guild = interaction.guild!;
    const config = await getModerationConfig(guild.id);
    if (!config.enabled) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Moderação desativada" })],
        ephemeral: true,
      });
    }

    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_mute"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para silenciar." })],
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("usuario", true);
    const durationInput = interaction.options.getString("duracao");
    const reason = interaction.options.getString("motivo") ?? undefined;

    let durationSec = parseDurationSeconds(durationInput) ?? config.default_mute_duration ?? 600;
    if (durationSec > MAX_TIMEOUT && !config.mute_role_id) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem cargo de mute configurado, duração máxima é 28 dias." })],
        ephemeral: true,
      });
    }

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Usuário não está no servidor" })],
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
    await dmPunishedUser({
      guild,
      type: "TEMP_MUTE",
      target: user,
      moderator: interaction.user,
      reason,
      durationSeconds: durationSec,
      config,
    });

    if (config.mute_role_id) {
      const role = await guild.roles.fetch(config.mute_role_id).catch(() => null);
      if (!role) {
        return interaction.editReply({
          embeds: [brandEmbed({ kind: "error", title: "Cargo de mute não encontrado." })],
        });
      }
      await member.roles.add(role, `[${interaction.user.tag}] ${reason ?? "mute"}`);
    } else {
      if (!member.moderatable) {
        return interaction.editReply({
          embeds: [brandEmbed({ kind: "error", title: "Não consigo silenciar (hierarquia)." })],
        });
      }
      await member.timeout(Math.min(durationSec, MAX_TIMEOUT) * 1000, `[${interaction.user.tag}] ${reason ?? "mute"}`);
    }

    const punishment = await createPunishment({
      guildId: guild.id,
      userId: user.id,
      username: user.tag,
      moderatorId: interaction.user.id,
      moderatorName: interaction.user.tag,
      type: "TEMP_MUTE",
      reason,
      durationSeconds: durationSec,
    });
    if (config.mute_role_id) {
      await scheduleTemporaryAction({
        guildId: guild.id,
        userId: user.id,
        actionType: "TEMP_MUTE",
        expiresAt: new Date(Date.now() + durationSec * 1000),
        punishmentId: punishment?.id ?? null,
      });
    }

    await logModerationEvent({
      guildId: guild.id,
      userId: user.id,
      moderatorId: interaction.user.id,
      action: "TEMP_MUTE",
      reason,
    });
    await postModerationLog({
      guild,
      type: "TEMP_MUTE",
      target: user,
      moderator: interaction.user,
      reason,
      durationSeconds: durationSec,
      config,
    });

    await interaction.editReply({
      embeds: [
        brandEmbed({
          kind: "success",
          title: "Usuário silenciado",
          description: `<@${user.id}> silenciado.`,
        }),
      ],
    });
  },
};

export default command;
