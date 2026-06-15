import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { logModeration, parseDuration, recordPunishment } from "../../systems/moderation/punish.js";

const MAX = 28 * 24 * 60 * 60 * 1000; // 28d

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ModerateMembers],
  botPermissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Silencia um usuário usando timeout nativo do Discord.")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
    .addStringOption((o) => o.setName("duracao").setDescription("Ex: 10m, 1h, 1d (máx 28d)").setRequired(true))
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo")),
  async execute(interaction) {
    const user = interaction.options.getUser("usuario", true);
    const duration = interaction.options.getString("duracao", true);
    const reason = interaction.options.getString("motivo") ?? undefined;
    const durationMs = parseDuration(duration);
    if (!durationMs || durationMs > MAX) {
      return interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Duração inválida (máx 28d)" })], ephemeral: true });
    }
    const member = await interaction.guild!.members.fetch(user.id).catch(() => null);
    if (!member?.moderatable) {
      return interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Não consigo silenciar este usuário" })], ephemeral: true });
    }
    await interaction.deferReply();
    await member.timeout(durationMs, `[${interaction.user.tag}] ${reason ?? "Sem motivo"}`);
    await recordPunishment({ guildId: interaction.guildId!, userId: user.id, moderatorId: interaction.user.id, type: "TEMPMUTE", reason, durationMs });
    await logModeration(member, "TEMPMUTE", interaction.user.id, reason, duration);
    await interaction.editReply({
      embeds: [brandEmbed({ kind: "success", title: "Usuário silenciado", description: `<@${user.id}> por **${duration}**.` })],
    });
  },
};

export default command;
