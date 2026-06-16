import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { listUserWarnings } from "../../systems/moderation/moderation.service.js";
import { hasModCapability } from "../../systems/moderation/moderation.permissions.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("warns")
    .setDescription("Lista as advertências ativas de um usuário.")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true)),
  async execute(interaction) {
    const guild = interaction.guild!;
    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_view_history"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para ver histórico." })],
        ephemeral: true,
      });
    }
    const user = interaction.options.getUser("usuario", true);
    const warns = await listUserWarnings(guild.id, user.id);
    const list = warns.length
      ? warns
          .slice(0, 15)
          .map(
            (w) =>
              `• \`#${w.id}\` <t:${Math.floor(new Date(w.created_at).getTime() / 1000)}:R> — ${w.reason ?? "Sem motivo"} (mod: <@${w.moderator_id}>)`,
          )
          .join("\n")
      : "Nenhuma advertência ativa.";
    await interaction.reply({
      embeds: [
        brandEmbed({
          title: `Advertências de ${user.tag}`,
          thumbnail: user.displayAvatarURL(),
          description: list.slice(0, 4000),
        }),
      ],
      ephemeral: true,
    });
  },
};

export default command;
