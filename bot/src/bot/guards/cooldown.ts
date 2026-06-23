import { ChatInputCommandInteraction } from "discord.js";
import { findActiveCooldown, upsertCooldown } from "../repositories/cooldowns.repo.js";

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
  const existing = await findActiveCooldown(
    interaction.guildId,
    interaction.user.id,
    commandName,
    now,
  );

  if (existing) {
    return { ok: false, remainingMs: existing.expiresAt.getTime() - now.getTime() };
  }

  const expiresAt = new Date(now.getTime() + seconds * 1000);
  await upsertCooldown(
    interaction.guildId,
    interaction.user.id,
    commandName,
    expiresAt,
  );
  return { ok: true };
}
