import { prisma } from "../../database/client.js";
import type { Guild } from "discord.js";

/** Garante que o guild + config existam no banco. */
export async function ensureGuild(guild: Guild) {
  await prisma.guild.upsert({
    where: { id: guild.id },
    create: {
      id: guild.id,
      name: guild.name,
      config: { create: {} },
    },
    update: { name: guild.name },
  });
}

export async function getConfig(guildId: string) {
  let cfg = await prisma.guildConfig.findUnique({ where: { guildId } });
  if (!cfg) {
    await prisma.guild.upsert({
      where: { id: guildId },
      create: { id: guildId, name: "unknown", config: { create: {} } },
      update: {},
    });
    cfg = await prisma.guildConfig.findUnique({ where: { guildId } });
  }
  return cfg!;
}

export async function ensureUser(id: string, username?: string | null) {
  await prisma.user.upsert({
    where: { id },
    create: { id, username: username ?? null },
    update: { username: username ?? undefined },
  });
}
