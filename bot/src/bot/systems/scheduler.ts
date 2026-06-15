import { Client } from "discord.js";
import { VipMembership, Punishment } from "../../database/models.js";
import { logger } from "../utils/logger.js";
import { getConfig } from "../utils/guildCache.js";
import { sendLog } from "./logs/sender.js";
import { brandEmbed } from "../utils/embed.js";

const INTERVAL_MS = 60_000;

export function startSchedulers(client: Client) {
  setInterval(() => {
    void tick(client).catch((err) => logger.error({ err }, "scheduler tick falhou"));
  }, INTERVAL_MS);
  logger.info("⏱️  Schedulers iniciados (1 min)");
}

async function tick(client: Client) {
  const now = new Date();

  const expiredVips = await VipMembership.find({ active: true, expiresAt: { $ne: null, $lte: now } }).limit(100);
  for (const v of expiredVips) {
    v.active = false;
    await v.save();
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

  const expiredBans = await Punishment.find({ active: true, type: "TEMPBAN", expiresAt: { $ne: null, $lte: now } }).limit(50);
  for (const p of expiredBans) {
    const guild = client.guilds.cache.get(p.guildId);
    if (!guild) continue;
    await guild.bans.remove(p.userId, "tempban expirou").catch(() => {});
    p.active = false;
    await p.save();
  }
}
