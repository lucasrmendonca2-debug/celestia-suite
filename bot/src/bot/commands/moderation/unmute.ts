import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { logModeration, recordPunishment } from "../../systems/moderation/punish.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ModerateMembers],
  botPermissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove o timeout de um usuário.")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser("usuario", true);
    const member = await interaction.guild!.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Usuário não está no servidor" })], ephemeral: true });
    await interaction.deferReply();
    await member.timeout(null, `[${interaction.user.tag}] unmute`);
    await recordPunishment({ guildId: interaction.guildId!, userId: user.id, moderatorId: interaction.user.id, type: "UNMUTE" });
    await logModeration(member, "UNMUTE", interaction.user.id);
    await interaction.editReply({ embeds: [brandEmbed({ kind: "success", title: "Usuário liberado", description: `<@${user.id}> não está mais silenciado.` })] });
  },
};

export default command;
