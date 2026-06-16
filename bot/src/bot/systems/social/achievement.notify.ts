import type { Message, TextBasedChannel } from "discord.js";
import { brandEmbed } from "../../utils/embed.js";
import type { UnlockedAchievement } from "./achievement.service.js";

/** Envia uma embed única no canal listando as conquistas desbloqueadas. */
export async function announceAchievements(
  msg: Message,
  unlocked: UnlockedAchievement[],
): Promise<void> {
  if (unlocked.length === 0) return;
  const channel = msg.channel as TextBasedChannel;
  if (!channel || !("send" in channel)) return;

  const lines = unlocked.map((u) => {
    const a = u.achievement;
    const reward: string[] = [];
    if (a.reward_coins > 0) reward.push(`💰 ${a.reward_coins}`);
    if (a.reward_xp > 0) reward.push(`✨ ${a.reward_xp} XP`);
    if (u.badgeAwarded) reward.push("🏅 badge");
    const rs = reward.length > 0 ? ` *(${reward.join(" · ")})*` : "";
    return `${a.emoji} **${a.name}** — ${a.description || "Conquista desbloqueada!"}${rs}`;
  });
  await channel
    .send({
      embeds: [
        brandEmbed({
          kind: "success",
          title: `🏆 ${msg.author.username} desbloqueou ${unlocked.length} conquista${unlocked.length > 1 ? "s" : ""}!`,
          description: lines.join("\n"),
        }),
      ],
    })
    .catch(() => {});
}
