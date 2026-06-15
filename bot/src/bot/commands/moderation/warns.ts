import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { Warning, Punishment } from "../../../database/models.js";

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
      Warning.find({ guildId: interaction.guildId!, userId: user.id }).sort({ createdAt: -1 }).limit(10).lean(),
      Punishment.find({ guildId: interaction.guildId!, userId: user.id }).sort({ createdAt: -1 }).limit(10).lean(),
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
                ? warns
                    .map((w) => `• <t:${Math.floor(new Date(w.createdAt as unknown as Date).getTime() / 1000)}:R> — ${w.reason}`)
                    .join("\n")
                    .slice(0, 1024)
                : "Nenhuma",
            },
            {
              name: `Punições (${punishments.length})`,
              value: punishments.length
                ? punishments
                    .map((p) => `• \`${p.type}\` <t:${Math.floor(new Date(p.createdAt as unknown as Date).getTime() / 1000)}:R> ${p.reason ?? ""}`)
                    .join("\n")
                    .slice(0, 1024)
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
