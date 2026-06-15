import { Client } from "discord.js";
import { prisma } from "../../../database/client.js";
import { logger } from "../../utils/logger.js";
import { getConfig } from "../../utils/guildCache.js";
import { sendLog } from "../logs/sender.js";
import { brandEmbed } from "../../utils/embed.js";

const INTERVAL_MS = 60_000;

/** Job periódico: expira VIPs, tempbans e tempmutes. */
export function startSchedulers(client: Client) {
  setInterval(() => {
    void tick(client).catch((err) => logger.error({ err }, "scheduler tick falhou"));
  }, INTERVAL_MS);
  logger.info("⏱️  Schedulers iniciados (1 min)");
}

async function tick(client: Client) {
  const now = new Date();

  // VIPs expirados
  const expiredVips = await prisma.vipMembership.findMany({
    where: { active: true, expiresAt: { not: null, lte: now } },
    take: 100,
  });
  for (const v of expiredVips) {
    await prisma.vipMembership.update({ where: { id: v.id }, data: { active: false } });
    const guild = client.guilds.cache.get(v.guildId);
    if (!guild) continue;
    const cfg = await getConfig(v.guildId).catch(() => null);
    if (cfg?.vipRoleId) {
      const member = await guild.members.fetch(v.userId).catch(() => null);
      const role = guild.roles.cache.get(cfg.vipRoleId);
      if (member && role) await member.roles.remove(role).catch(() => {});
    }
    await sendLog(
      guild,
      "modLogChannelId",
      brandEmbed({ kind: "warn", title: "💎 VIP expirado", description: `<@${v.userId}> teve o VIP expirado.` }),
      "vip.expire",
      { userId: v.userId },
    );
  }

  // Tempbans expirados
  const expiredBans = await prisma.punishment.findMany({
    where: { active: true, type: "TEMPBAN", expiresAt: { not: null, lte: now } },
    take: 50,
  });
  for (const p of expiredBans) {
    const guild = client.guilds.cache.get(p.guildId);
    if (!guild) continue;
    await guild.bans.remove(p.userId, "tempban expirou").catch(() => {});
    await prisma.punishment.update({ where: { id: p.id }, data: { active: false } });
  }
}
