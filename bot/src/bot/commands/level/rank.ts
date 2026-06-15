import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { LevelAccount } from "../../../database/models.js";
import { xpForLevel } from "../../systems/level/level.js";

function bar(current: number, max: number, length = 18) {
  const ratio = Math.max(0, Math.min(1, current / max));
  const filled = Math.round(ratio * length);
  return `${"█".repeat(filled)}${"░".repeat(length - filled)}`;
}

const command: SlashCommand = {
  category: "level",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Mostra seu nível e XP.")
    .addUserOption((o) => o.setName("usuario").setDescription("Outro usuário")),
  async execute(interaction) {
    const target = interaction.options.getUser("usuario") ?? interaction.user;
    const acc = await LevelAccount.findOne({ guildId: interaction.guildId!, userId: target.id });
    if (!acc) {
      await interaction.reply({
        embeds: [brandEmbed({ kind: "info", title: "Sem XP ainda", description: `${target.username} ainda não enviou mensagens.` })],
      });
      return;
    }
    const next = xpForLevel(acc.level);
    await interaction.reply({
      embeds: [
        brandEmbed({
          title: `📈 ${target.username}`,
          thumbnail: target.displayAvatarURL(),
          fields: [
            { name: "Nível", value: String(acc.level), inline: true },
            { name: "XP", value: `${acc.xp.toLocaleString("pt-BR")} / ${next.toLocaleString("pt-BR")}`, inline: true },
            { name: "Total", value: acc.totalXp.toLocaleString("pt-BR"), inline: true },
            { name: "Progresso", value: `\`${bar(acc.xp, next)}\`` },
          ],
        }),
      ],
    });
  },
};
export default command;
