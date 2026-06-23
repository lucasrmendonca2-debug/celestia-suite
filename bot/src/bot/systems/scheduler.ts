import { Client, type TextChannel } from "discord.js";
import { VipMembership, Punishment, Giveaway } from "../../database/models.js";
import {
  findDueReminders,
  markReminderFired,
  findDueAnnouncements,
  markAnnouncementSent,
  type AnnouncementRow,
} from "../repositories/content.repo.js";
import { logger } from "../utils/logger.js";
import { getConfig } from "../utils/guildCache.js";
import { sendLog } from "./logs/sender.js";
import { brandEmbed } from "../utils/embed.js";
import { endGiveaway } from "./giveaway/giveaway.js";
import { tickPremiumExpirations } from "./premium/premium.expiration.js";
import { deliverPendingInsights, deliverPendingMilestones } from "./intelligence/insights.delivery.js";

let intelligenceTickCounter = 0;

const INTERVAL_MS = 30_000;

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

  // Giveaways prontos para encerrar
  const ending = await Giveaway.find({ ended: false, endsAt: { $lte: now } }).limit(50);
  for (const g of ending) {
    await endGiveaway(client, String(g._id)).catch((err) =>
      logger.error({ err, giveawayId: String(g._id) }, "endGiveaway falhou"),
    );
  }

  // Expiração de assinaturas premium
  await tickPremiumExpirations(client).catch((err) =>
    logger.error({ err }, "tickPremiumExpirations falhou"),
  );

  // Camada de inteligência: a cada 10 ticks (~5 min) entrega insights/marcos pendentes
  intelligenceTickCounter++;
  if (intelligenceTickCounter >= 10) {
    intelligenceTickCounter = 0;
    await deliverPendingInsights(client).catch((err) =>
      logger.error({ err }, "deliverPendingInsights falhou"),
    );
    await deliverPendingMilestones(client).catch((err) =>
      logger.error({ err }, "deliverPendingMilestones falhou"),
    );
  }

  // Lembretes a entregar
  const reminders = await Reminder.find({ delivered: false, remindAt: { $lte: now } }).limit(50);
  for (const r of reminders) {
    try {
      const ch = (await client.channels.fetch(r.channelId).catch(() => null)) as TextChannel | null;
      if (ch?.isTextBased()) {
        await ch.send({
          content: `<@${r.userId}>`,
          embeds: [
            brandEmbed({
              kind: "info",
              title: "⏰ Lembrete",
              description: r.message,
            }),
          ],
          allowedMentions: { users: [r.userId] },
        });
      } else {
        const user = await client.users.fetch(r.userId).catch(() => null);
        await user?.send({
          embeds: [brandEmbed({ kind: "info", title: "⏰ Lembrete", description: r.message })],
        });
      }
    } catch (err) {
      logger.error({ err, reminderId: String(r._id) }, "reminder delivery falhou");
    }
    r.delivered = true;
    await r.save();
  }

  // Anúncios agendados
  const announcements = await Announcement.find({
    sent: false,
    scheduledFor: { $ne: null, $lte: now },
  }).limit(20);
  for (const a of announcements) {
    try {
      const ch = (await client.channels.fetch(a.channelId).catch(() => null)) as TextChannel | null;
      if (ch?.isTextBased()) {
        const content =
          a.mention === "everyone"
            ? "@everyone"
            : a.mention === "here"
              ? "@here"
              : a.mention && /^\d{17,20}$/.test(a.mention)
                ? `<@&${a.mention}>`
                : undefined;
        await ch.send({
          content,
          embeds: [
            brandEmbed({
              kind: "info",
              title: a.title ?? "📣 Anúncio",
              description: a.content,
            }),
          ],
          allowedMentions:
            a.mention === "everyone" || a.mention === "here"
              ? { parse: ["everyone"] }
              : a.mention && /^\d{17,20}$/.test(a.mention)
                ? { roles: [a.mention] }
                : { parse: [] },
        });
      }
      a.sent = true;
      a.sentAt = new Date();
      await a.save();
    } catch (err) {
      logger.error({ err, announcementId: String(a._id) }, "announcement delivery falhou");
    }
  }
}
