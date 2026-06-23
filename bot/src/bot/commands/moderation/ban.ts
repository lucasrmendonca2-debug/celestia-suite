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
    .setName("ban")
    .setDescription("Bane um usuário do servidor (permanente ou temporário).")
    .addUserOption((o) =>
      o.setName("usuario").setDescription("Usuário a ser banido").setRequired(true),
    )
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo do banimento"))
    .addStringOption((o) =>
      o.setName("duracao").setDescription("Ex.: 7d, 24h, 30m (opcional = permanente)"),
    )
    .addIntegerOption((o) =>
      o
        .setName("apagar_dias")
        .setDescription("Apagar mensagens dos últimos N dias (0-7)")
        .setMinValue(0)
        .setMaxValue(7),
    ),
  async execute(interaction) {
    const guild = interaction.guild!;
    const config = await getModerationConfig(guild.id);
    if (!config.enabled) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Moderação desativada", description: "Ative o módulo no dashboard." })],
        flags: MessageFlags.Ephemeral,
      });
    }

    const author = await guild.members.fetch(interaction.user.id);
    const durationSec = parseDurationSeconds(interaction.options.getString("duracao"));
    const capability = "can_ban";
    if (!(await hasModCapability(author, capability))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para banir." })],
        flags: MessageFlags.Ephemeral,
      });
    }
    if (durationSec && !config.allow_temporary_ban) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Ban temporário desativado no dashboard." })],
        flags: MessageFlags.Ephemeral,
      });
    }

    const user = interaction.options.getUser("usuario", true);
    const reason = interaction.options.getString("motivo") ?? undefined;
    const deleteDays = interaction.options.getInteger("apagar_dias") ?? 0;

    const { pick, moderationResponses } = await import("../../systems/personality/random-responses.js");
    if (user.id === interaction.user.id) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "warn", title: "Auto-ban?", description: "Tá querendo se exilar do servidor? Pensa com calma. 😅" })],
        flags: MessageFlags.Ephemeral,
      });
    }
    if (user.id === interaction.client.user.id) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "warn", title: "Banir o bot?", description: pick(moderationResponses.banBot) })],
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
          embeds: [brandEmbed({ kind: "error", title: "Não consigo banir esse usuário (hierarquia/permissões)." })],
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    await interaction.deferReply();

    const expiresAt = durationSec ? new Date(Date.now() + durationSec * 1000) : null;
    const modCase = await createCase({
      guildId: guild.id,
      userId: user.id,
      userTag: user.tag,
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      action: durationSec ? "TEMP_BAN" : "BAN",
      reason,
      durationSeconds: durationSec,
      expiresAt,
      source: "BOT",
    });

    // DM antes de banir
    await dmPunishedUser({
      guild,
      type: durationSec ? "TEMP_BAN" : "BAN",
      target: user,
      moderator: interaction.user,
      reason,
      durationSeconds: durationSec,
      config,
      caseNumber: modCase.case_number,
    });

    await guild.bans.create(user.id, {
      reason: `[${interaction.user.tag}] ${reason ?? "Sem motivo"}`,
      deleteMessageSeconds: deleteDays * 86400,
    });

    const punishment = await createPunishment({
      guildId: guild.id,
      userId: user.id,
      username: user.tag,
      moderatorId: interaction.user.id,
      moderatorName: interaction.user.tag,
      type: durationSec ? "TEMP_BAN" : "BAN",
      reason,
      durationSeconds: durationSec,
    });

    if (durationSec && expiresAt) {
      await scheduleTemporaryAction({
        guildId: guild.id,
        userId: user.id,
        actionType: "TEMP_BAN",
        expiresAt,
        punishmentId: punishment?.id ?? null,
      });
    }

    await logModerationEvent({
      guildId: guild.id,
      userId: user.id,
      moderatorId: interaction.user.id,
      action: durationSec ? "TEMP_BAN" : "BAN",
      reason,
      details: { caseNumber: modCase.case_number, duration: durationSec },
    });
    await postModerationLog({
      guild,
      type: durationSec ? "TEMP_BAN" : "BAN",
      target: user,
      moderator: interaction.user,
      reason,
      durationSeconds: durationSec,
      config,
      caseNumber: modCase.case_number,
    });

    await interaction.editReply({
      embeds: [
        brandEmbed({
          kind: "success",
          title: durationSec
            ? `Banimento temporário · Caso #${modCase.case_number}`
            : `Banimento aplicado · Caso #${modCase.case_number}`,
          description: `<@${user.id}> foi banido.`,
        }),
      ],
    });
  },
};

export default command;
