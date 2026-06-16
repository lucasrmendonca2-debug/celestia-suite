import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import {
  countActiveWarnings,
  createWarning,
  getModerationConfig,
  logModerationEvent,
} from "../../systems/moderation/moderation.service.js";
import {
  canPunishTarget,
  hasModCapability,
} from "../../systems/moderation/moderation.permissions.js";
import {
  dmPunishedUser,
  postModerationLog,
} from "../../systems/moderation/moderation.logger.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Adverte um usuário.")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo").setRequired(true)),
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
    if (!(await hasModCapability(author, "can_warn"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para advertir." })],
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("usuario", true);
    const reason = interaction.options.getString("motivo", true);
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (member) {
      const check = await canPunishTarget(author, member, config);
      if (!check.ok) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Não posso punir", description: check.reason })],
          ephemeral: true,
        });
      }
    }

    await interaction.deferReply();
    const warn = await createWarning({
      guildId: guild.id,
      userId: user.id,
      username: user.tag,
      moderatorId: interaction.user.id,
      moderatorName: interaction.user.tag,
      reason,
    });

    const total = await countActiveWarnings(guild.id, user.id);

    await dmPunishedUser({
      guild,
      type: "WARN",
      target: user,
      moderator: interaction.user,
      reason,
      config,
    });
    await logModerationEvent({
      guildId: guild.id,
      userId: user.id,
      moderatorId: interaction.user.id,
      action: "WARN",
      reason,
      details: { warningId: warn.id, total },
    });
    await postModerationLog({
      guild,
      type: "WARN",
      target: user,
      moderator: interaction.user,
      reason,
      config,
      extra: [{ name: "Warns ativos", value: `${total}/${config.max_warnings}`, inline: true }],
    });

    await interaction.editReply({
      embeds: [
        brandEmbed({
          kind: "warn",
          title: "Advertência registrada",
          description: `<@${user.id}> recebeu uma advertência (${total}/${config.max_warnings}).`,
          fields: [{ name: "Motivo", value: reason }],
        }),
      ],
    });

    // Escalonamento automático
    if (total >= config.max_warnings && config.default_warn_punishment !== "none" && member) {
      const dur = config.default_warn_punishment_duration ?? 3600;
      try {
        if (config.default_warn_punishment === "kick" && member.kickable) {
          await member.kick("Limite de warns atingido");
        } else if (
          (config.default_warn_punishment === "ban" || config.default_warn_punishment === "temp_ban") &&
          member.bannable
        ) {
          await guild.bans.create(member.id, {
            reason: "Limite de warns atingido",
            deleteMessageSeconds: 0,
          });
        } else if (
          (config.default_warn_punishment === "mute" || config.default_warn_punishment === "temp_mute") &&
          member.moderatable
        ) {
          await member.timeout(Math.min(dur, 28 * 86400) * 1000, "Limite de warns atingido");
        }
      } catch {
        /* noop */
      }
    }
  },
};

export default command;
