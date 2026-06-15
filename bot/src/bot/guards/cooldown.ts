import { ChatInputCommandInteraction } from "discord.js";
import { prisma } from "../../database/client.js";

interface CooldownResult {
  ok: boolean;
  remainingMs?: number;
}

/**
 * Cooldown persistido por usuário + comando + guild.
 * Usa upsert atômico no Postgres — sobrevive a restart do bot.
 */
export async function consumeCooldown(
  interaction: ChatInputCommandInteraction,
  commandName: string,
  seconds: number,
): Promise<CooldownResult> {
  if (!interaction.guildId) return { ok: true };
  const now = new Date();
  const existing = await prisma.cooldown.findUnique({
    where: {
      guildId_userId_command: {
        guildId: interaction.guildId,
        userId: interaction.user.id,
        command: commandName,
      },
    },
  });

  if (existing && existing.expiresAt > now) {
    return { ok: false, remainingMs: existing.expiresAt.getTime() - now.getTime() };
  }

  const expiresAt = new Date(now.getTime() + seconds * 1000);
  await prisma.cooldown.upsert({
    where: {
      guildId_userId_command: {
        guildId: interaction.guildId,
        userId: interaction.user.id,
        command: commandName,
      },
    },
    create: {
      guildId: interaction.guildId,
      userId: interaction.user.id,
      command: commandName,
      expiresAt,
    },
    update: { expiresAt },
  });
  return { ok: true };
}
