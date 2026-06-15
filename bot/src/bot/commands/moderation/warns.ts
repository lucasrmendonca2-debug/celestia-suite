import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { prisma } from "../../../database/client.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName("warns")
    .setDescription("Lista as advertências e punições de um usuário.")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser("usuario", true);
    const [warns, punishments] = await Promise.all([
      prisma.warning.findMany({ where: { guildId: interaction.guildId!, userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.punishment.findMany({ where: { guildId: interaction.guildId!, userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    ]);
    await interaction.reply({
      embeds: [
        brandEmbed({
          title: `Histórico de ${user.tag}`,
          thumbnail: user.displayAvatarURL(),
          fields: [
            {
              name: `Advertências (${warns.length})`,
              value: warns.length
                ? warns.map((w) => `• <t:${Math.floor(w.createdAt.getTime() / 1000)}:R> — ${w.reason}`).join("\n").slice(0, 1024)
                : "Nenhuma",
            },
            {
              name: `Punições (${punishments.length})`,
              value: punishments.length
                ? punishments.map((p) => `• \`${p.type}\` <t:${Math.floor(p.createdAt.getTime() / 1000)}:R> ${p.reason ?? ""}`).join("\n").slice(0, 1024)
                : "Nenhuma",
            },
          ],
        }),
      ],
      ephemeral: true,
    });
  },
};

export default command;
