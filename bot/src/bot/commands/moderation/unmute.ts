import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
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
  botPermissions: [PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.ManageRoles],
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove o silenciamento de um usuário.")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo")),
  async execute(interaction) {
    const guild = interaction.guild!;
    const config = await getModerationConfig(guild.id);
    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_unmute"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para desmutar." })],
        flags: MessageFlags.Ephemeral,
      });
    }

    const user = interaction.options.getUser("usuario", true);
    const reason = interaction.options.getString("motivo") ?? undefined;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Usuário não está no servidor" })],
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();
    if (config.mute_role_id && member.roles.cache.has(config.mute_role_id)) {
      await member.roles.remove(config.mute_role_id, `[${interaction.user.tag}] unmute`);
    }
    if (member.isCommunicationDisabled()) {
      await member.timeout(null, `[${interaction.user.tag}] unmute`);
    }

    await deactivatePunishmentsByType(guild.id, user.id, ["MUTE", "TEMP_MUTE"]);
    await createPunishment({
      guildId: guild.id,
      userId: user.id,
      username: user.tag,
      moderatorId: interaction.user.id,
      moderatorName: interaction.user.tag,
      type: "UNMUTE",
      reason,
    });
    await logModerationEvent({
      guildId: guild.id,
      userId: user.id,
      moderatorId: interaction.user.id,
      action: "UNMUTE",
      reason,
    });
    await postModerationLog({
      guild,
      type: "UNMUTE",
      target: user,
      moderator: interaction.user,
      reason,
      config,
    });

    await interaction.editReply({
      embeds: [brandEmbed({ kind: "success", title: "Usuário desmutado", description: `<@${user.id}> liberado.` })],
    });
  },
};

export default command;
