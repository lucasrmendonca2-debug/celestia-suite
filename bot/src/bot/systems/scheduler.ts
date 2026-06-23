import { Client, type TextChannel } from "discord.js";
import {
  findExpiredUserVips,
  markVipExpired,
  findExpiredTempbans,
  markPunishmentInactive,
  findDueGiveaways,
} from "../repositories/phase4.repo.js";
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
  const reminders = await findDueReminders(now, 50);
  for (const r of reminders) {
    try {
      const ch = r.channel_id
        ? ((await client.channels.fetch(r.channel_id).catch(() => null)) as TextChannel | null)
        : null;
      if (ch?.isTextBased()) {
        await ch.send({
          content: `<@${r.user_id}>`,
          embeds: [
            brandEmbed({
              kind: "info",
              title: "⏰ Lembrete",
              description: r.message,
            }),
          ],
          allowedMentions: { users: [r.user_id] },
        });
      } else {
        const user = await client.users.fetch(r.user_id).catch(() => null);
        await user?.send({
          embeds: [brandEmbed({ kind: "info", title: "⏰ Lembrete", description: r.message })],
        });
      }
    } catch (err) {
      logger.error({ err, reminderId: r.id }, "reminder delivery falhou");
    }
    await markReminderFired(r.id);
  }

  // Anúncios agendados
  const announcements = await findDueAnnouncements(now, 20);
  for (const a of announcements) {
    const meta = (a.embed ?? {}) as { title?: string | null; mention?: string | null };
    const mention = meta.mention ?? null;
    try {
      const ch = (await client.channels.fetch(a.channel_id).catch(() => null)) as TextChannel | null;
      if (ch?.isTextBased()) {
        const content =
          mention === "everyone"
            ? "@everyone"
            : mention === "here"
              ? "@here"
              : mention && /^\d{17,20}$/.test(mention)
                ? `<@&${mention}>`
                : undefined;
        const sent = await ch.send({
          content,
          embeds: [
            brandEmbed({
              kind: "info",
              title: meta.title ?? "📣 Anúncio",
              description: a.content ?? "",
            }),
          ],
          allowedMentions:
            mention === "everyone" || mention === "here"
              ? { parse: ["everyone"] }
              : mention && /^\d{17,20}$/.test(mention)
                ? { roles: [mention] }
                : { parse: [] },
        });
        await markAnnouncementSent(a.id, sent.id);
      } else {
        await markAnnouncementSent(a.id, null);
      }
    } catch (err) {
      logger.error({ err, announcementId: a.id }, "announcement delivery falhou");
    }
  }
}

// type re-export usado por consumers externos (se houver)
export type { AnnouncementRow };
