import { ChatInputCommandInteraction } from "discord.js";
import { Cooldown } from "../../database/models.js";

interface CooldownResult {
  ok: boolean;
  remainingMs?: number;
}

export async function consumeCooldown(
  interaction: ChatInputCommandInteraction,
  commandName: string,
  seconds: number,
): Promise<CooldownResult> {
  if (!interaction.guildId) return { ok: true };
  const now = new Date();
  const existing = await Cooldown.findOne({
    guildId: interaction.guildId,
    userId: interaction.user.id,
    command: commandName,
  });

  if (existing && existing.expiresAt > now) {
    return { ok: false, remainingMs: existing.expiresAt.getTime() - now.getTime() };
  }

  const expiresAt = new Date(now.getTime() + seconds * 1000);
  await Cooldown.updateOne(
    { guildId: interaction.guildId, userId: interaction.user.id, command: commandName },
    { $set: { expiresAt } },
    { upsert: true },
  );
  return { ok: true };
}
