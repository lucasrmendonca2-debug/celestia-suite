import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { prisma } from "../../../database/client.js";
import { logModeration } from "../../systems/moderation/punish.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Advertir um usuário.")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo").setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser("usuario", true);
    const reason = interaction.options.getString("motivo", true);
    const warn = await prisma.warning.create({
      data: { guildId: interaction.guildId!, userId: user.id, moderatorId: interaction.user.id, reason },
    });
    const member = await interaction.guild!.members.fetch(user.id).catch(() => null);
    if (member) await logModeration(member, "WARN", interaction.user.id, reason);
    await interaction.reply({
      embeds: [
        brandEmbed({
          kind: "warn",
          title: "Advertência registrada",
          description: `<@${user.id}> recebeu uma advertência.`,
          fields: [
            { name: "Motivo", value: reason },
            { name: "ID", value: `\`${warn.id}\``, inline: true },
          ],
        }),
      ],
    });
    await user.send({
      embeds: [brandEmbed({ kind: "warn", title: `Você foi advertido em ${interaction.guild!.name}`, description: reason })],
    }).catch(() => {});
  },
};

export default command;
