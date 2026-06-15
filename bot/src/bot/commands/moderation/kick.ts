import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { logModeration, recordPunishment } from "../../systems/moderation/punish.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.KickMembers],
  botPermissions: [PermissionFlagsBits.KickMembers],
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulsa um usuário do servidor.")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário a ser expulso").setRequired(true))
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo")),
  async execute(interaction) {
    const user = interaction.options.getUser("usuario", true);
    const reason = interaction.options.getString("motivo") ?? undefined;
    const member = await interaction.guild!.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Usuário não está no servidor" })], ephemeral: true });
    }
    if (!member.kickable) {
      return interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Não consigo expulsar este usuário" })], ephemeral: true });
    }
    await interaction.deferReply();
    await member.kick(`[${interaction.user.tag}] ${reason ?? "Sem motivo"}`);
    await recordPunishment({ guildId: interaction.guildId!, userId: user.id, moderatorId: interaction.user.id, type: "KICK", reason });
    await logModeration(member, "KICK", interaction.user.id, reason);
    await interaction.editReply({
      embeds: [brandEmbed({ kind: "success", title: "Usuário expulso", description: `<@${user.id}> foi expulso.` })],
    });
  },
};

export default command;
