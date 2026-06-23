import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import {
  createPunishment,
  deactivatePunishmentsByType,
  getModerationConfig,
  logModerationEvent,
} from "../../systems/moderation/moderation.service.js";
import { hasModCapability } from "../../systems/moderation/moderation.permissions.js";
import { postModerationLog } from "../../systems/moderation/moderation.logger.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  botPermissions: [PermissionFlagsBits.BanMembers],
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Remove o banimento de um usuário.")
    .addStringOption((o) =>
      o.setName("user_id").setDescription("ID do usuário banido").setRequired(true),
    )
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo")),
  async execute(interaction) {
    const guild = interaction.guild!;
    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_unban"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para desbanir." })],
        flags: MessageFlags.Ephemeral,
      });
    }
    const userId = interaction.options.getString("user_id", true).trim();
    if (!/^\d{5,32}$/.test(userId)) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "ID inválido." })],
        flags: MessageFlags.Ephemeral,
      });
    }
    const reason = interaction.options.getString("motivo") ?? undefined;
    await interaction.deferReply();
    const ban = await guild.bans.fetch(userId).catch(() => null);
    if (!ban) {
      return interaction.editReply({
        embeds: [brandEmbed({ kind: "error", title: "Esse usuário não está banido." })],
      });
    }
    await guild.bans.remove(userId, `[${interaction.user.tag}] ${reason ?? "unban"}`);

    await deactivatePunishmentsByType(guild.id, userId, ["BAN", "TEMP_BAN"]);
    await createPunishment({
      guildId: guild.id,
      userId,
      username: ban.user.tag,
      moderatorId: interaction.user.id,
      moderatorName: interaction.user.tag,
      type: "UNBAN",
      reason,
    });
    const config = await getModerationConfig(guild.id);
    await logModerationEvent({
      guildId: guild.id,
      userId,
      moderatorId: interaction.user.id,
      action: "UNBAN",
      reason,
    });
    await postModerationLog({
      guild,
      type: "UNBAN",
      target: ban.user,
      moderator: interaction.user,
      reason,
      config,
    });
    await interaction.editReply({
      embeds: [brandEmbed({ kind: "success", title: "Usuário desbanido", description: `<@${userId}> liberado.` })],
    });
  },
};

export default command;
