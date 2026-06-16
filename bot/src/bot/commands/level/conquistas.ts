import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import {
  listAchievements,
  listUserAchievements,
  getUserMetrics,
} from "../../systems/social/achievement.service.js";

const command: SlashCommand = {
  category: "level",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("conquistas")
    .setDescription("Veja conquistas do servidor e seu progresso.")
    .addUserOption((o) => o.setName("usuario").setDescription("Ver conquistas de outro usuário")) as SlashCommandBuilder,

  async execute(interaction) {
    if (!interaction.inGuild()) return;
    const target = interaction.options.getUser("usuario") ?? interaction.user;
    const guildId = interaction.guildId!;

    const [all, unlocked, metrics] = await Promise.all([
      listAchievements(guildId, true),
      listUserAchievements(guildId, target.id),
      getUserMetrics(guildId, target.id),
    ]);

    const unlockedIds = new Set(unlocked.map((u: any) => u.achievement?.id).filter(Boolean));

    const visible = all.filter((a) => !a.hidden || unlockedIds.has(a.id));
    const earnedPoints = unlocked.reduce(
      (sum: number, u: any) => sum + (u.achievement?.points ?? 0),
      0,
    );

    const lines = visible.map((a) => {
      const done = unlockedIds.has(a.id);
      const check = done ? "✅" : "⬜";
      let progress = "";
      if (!done && a.trigger_type !== "manual" && a.trigger_value > 0) {
        const current = (metrics as any)[a.trigger_type] ?? 0;
        progress = ` — *${Math.min(current, a.trigger_value)} / ${a.trigger_value}*`;
      }
      return `${check} ${a.emoji} **${a.name}** \`${a.points}pt\`${progress}${a.description ? `\n   ${a.description}` : ""}`;
    });

    await interaction.reply({
      embeds: [
        brandEmbed({
          title: `🏆 Conquistas — ${target.username}`,
          thumbnail: target.displayAvatarURL(),
          description: `**${unlocked.length} / ${all.length}** desbloqueadas · **${earnedPoints}** pontos\n\n${
            lines.length ? lines.join("\n\n") : "_Nenhuma conquista configurada._"
          }`.slice(0, 4000),
        }),
      ],
    });
  },
};
export default command;
