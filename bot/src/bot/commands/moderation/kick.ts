import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import {
  createPunishment,
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
import { createCase } from "../../systems/moderation/cases.service.js";
import { logger } from "../../utils/logger.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  botPermissions: [PermissionFlagsBits.KickMembers],
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulsa um usuário do servidor.")
    .addUserOption((o) =>
      o.setName("usuario").setDescription("Usuário a ser expulso").setRequired(true),
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
    if (!(await hasModCapability(author, "can_kick"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para expulsar." })],
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("usuario", true);
    const reason = interaction.options.getString("motivo") ?? undefined;

    const { pick, moderationResponses } = await import("../../systems/personality/random-responses.js");
    if (user.id === interaction.user.id) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "warn", title: "Auto-kick?", description: "Você não pode se expulsar. Mas pode dar /sair do canal, talvez? 😅" })],
        ephemeral: true,
      });
    }
    if (user.id === interaction.client.user.id) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "warn", title: "Expulsar o bot?", description: pick(moderationResponses.kickBot) })],
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
    if (!member.kickable) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Não consigo expulsar esse usuário (hierarquia)." })],
        ephemeral: true,
      });
    }

    await interaction.deferReply();
    await dmPunishedUser({ guild, type: "KICK", target: user, moderator: interaction.user, reason, config });
    await member.kick(`[${interaction.user.tag}] ${reason ?? "Sem motivo"}`);
    await createPunishment({
      guildId: guild.id,
      userId: user.id,
      username: user.tag,
      moderatorId: interaction.user.id,
      moderatorName: interaction.user.tag,
      type: "KICK",
      reason,
    });
    await logModerationEvent({
      guildId: guild.id,
      userId: user.id,
      moderatorId: interaction.user.id,
      action: "KICK",
      reason,
    });
    await postModerationLog({ guild, type: "KICK", target: user, moderator: interaction.user, reason, config });

    await interaction.editReply({
      embeds: [brandEmbed({ kind: "success", title: "Usuário expulso", description: `<@${user.id}> foi expulso.` })],
    });
  },
};

export default command;
