import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import {
  createWarning,
  getModerationConfig,
  logModerationEvent,
  sumActiveWarnPoints,
  type WarnSeverity,
} from "../../systems/moderation/moderation.service.js";
import {
  canPunishTarget,
  hasModCapability,
} from "../../systems/moderation/moderation.permissions.js";
import {
  dmPunishedUser,
  postModerationLog,
} from "../../systems/moderation/moderation.logger.js";
import { createCase } from "../../systems/moderation/cases.service.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("avisar")
    .setNameLocalizations({ "en-US": "warn" })
    .setDescription("Adverte um usuário.")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo").setRequired(true))
    .addStringOption((o) =>
      o
        .setName("severidade")
        .setDescription("Nível de severidade (padrão: média)")
        .addChoices(
          { name: "Baixa", value: "LOW" },
          { name: "Média", value: "MEDIUM" },
          { name: "Alta", value: "HIGH" },
        ),
    )
    .addStringOption((o) => o.setName("prova").setDescription("URL de imagem/print como prova")),
  async execute(interaction) {
    const guild = interaction.guild!;
    const config = await getModerationConfig(guild.id);
    if (!config.enabled) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Moderação desativada" })],
        flags: MessageFlags.Ephemeral,
      });
    }

    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_warn"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para advertir." })],
        flags: MessageFlags.Ephemeral,
      });
    }

    const user = interaction.options.getUser("usuario", true);
    const reason = interaction.options.getString("motivo", true);
    const severity = (interaction.options.getString("severidade") ?? "MEDIUM") as WarnSeverity;
    const proof = interaction.options.getString("prova");

    // Personalidade: alvos especiais
    const { pick } = await import("../../systems/personality/random-responses.js");
    const { moderationResponses } = await import("../../systems/personality/random-responses.js");
    if (user.id === interaction.user.id) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "warn", title: "Auto-advertência?", description: pick(moderationResponses.warnSelf) })],
        flags: MessageFlags.Ephemeral,
      });
    }
    if (user.id === interaction.client.user.id) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "warn", title: "Ei, sou eu!", description: pick(moderationResponses.warnBot) })],
        flags: MessageFlags.Ephemeral,
      });
    }
    if (proof && !/^https?:\/\//i.test(proof)) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Prova deve ser URL http(s)." })],
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
    }

    const points =
      severity === "LOW"
        ? config.warn_points_low
        : severity === "HIGH"
          ? config.warn_points_high
          : config.warn_points_medium;
    const expiresAt =
      config.warn_expiry_days > 0
        ? new Date(Date.now() + config.warn_expiry_days * 86400 * 1000)
        : null;

    await interaction.deferReply();
    const warn = await createWarning({
      guildId: guild.id,
      userId: user.id,
      username: user.tag,
      moderatorId: interaction.user.id,
      moderatorName: interaction.user.tag,
      reason,
      severity,
      points,
      proofUrl: proof,
      expiresAt,
    });

    const totalPoints = await sumActiveWarnPoints(guild.id, user.id);

    const modCase = await createCase({
      guildId: guild.id,
      userId: user.id,
      userTag: user.tag,
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      action: "WARN",
      reason,
      severity,
      proofUrl: proof,
      expiresAt,
      source: "BOT",
    });

    await dmPunishedUser({
      guild,
      type: "WARN",
      target: user,
      moderator: interaction.user,
      reason,
      config,
      caseNumber: modCase.case_number,
    });
    await logModerationEvent({
      guildId: guild.id,
      userId: user.id,
      moderatorId: interaction.user.id,
      action: "WARN",
      reason,
      details: { warningId: warn.id, severity, points, totalPoints, caseNumber: modCase.case_number },
    });
    await postModerationLog({
      guild,
      type: "WARN",
      target: user,
      moderator: interaction.user,
      reason,
      config,
      caseNumber: modCase.case_number,
      severity,
      proofUrl: proof,
      extra: [
        { name: "Pontos", value: `${totalPoints}/${config.max_warnings}`, inline: true },
      ],
    });

    await interaction.editReply({
      embeds: [
        brandEmbed({
          kind: "warn",
          title: `Advertência registrada · Caso #${modCase.case_number}`,
          description: `<@${user.id}> recebeu **${severity}** (+${points} ponto${points > 1 ? "s" : ""}) — total **${totalPoints}/${config.max_warnings}**.`,
          fields: [{ name: "Motivo", value: reason }],
        }),
      ],
    });

    // Escalonamento automático por pontos
    if (totalPoints >= config.max_warnings && config.default_warn_punishment !== "none" && member) {
      const dur = config.default_warn_punishment_duration ?? 3600;
      try {
        if (config.default_warn_punishment === "kick" && member.kickable) {
          await member.kick("Limite de pontos de advertência atingido");
        } else if (
          (config.default_warn_punishment === "ban" || config.default_warn_punishment === "temp_ban") &&
          member.bannable
        ) {
          await guild.bans.create(member.id, {
            reason: "Limite de pontos de advertência atingido",
            deleteMessageSeconds: 0,
          });
        } else if (
          (config.default_warn_punishment === "mute" || config.default_warn_punishment === "temp_mute") &&
          member.moderatable
        ) {
          await member.timeout(Math.min(dur, 28 * 86400) * 1000, "Limite de pontos atingido");
        }
      } catch {
        /* noop */
      }
    }
  },
};

export default command;
