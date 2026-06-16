import type { Message, GuildMember } from "discord.js";
import { supabase } from "../../../database/supabase.js";
import { logger } from "../../utils/logger.js";
import { getLevelConfig, getSocialConfig } from "./social.config.ts";
import { deriveLevel } from "./formulas.js";
import { applyLevelRewards } from "./level-rewards.service.js";
import { isVip } from "../economy/economy.js";
import { applyVars } from "../../utils/format.js";
import { brandEmbed } from "../../utils/embed.js";

interface PendingXp {
  guildId: string;
  userId: string;
  username: string;
  totalXpDelta: number;
  messagesDelta: number;
  lastXpAt: Date;
}

// Cache de cooldown em memória + buffer de gravação
const cooldown = new Map<string, number>(); // key = guild:user → epoch ms da última premiação
const buffer = new Map<string, PendingXp>(); // key = guild:user → delta pendente
const FLUSH_INTERVAL = 30_000;
const MAX_BUFFER = 200;

let flushTimer: NodeJS.Timeout | null = null;

function key(guildId: string, userId: string) {
  return `${guildId}:${userId}`;
}

function ensureFlushScheduled() {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    void flush();
  }, FLUSH_INTERVAL);
  // Sem unref: queremos manter o bot ativo. NodeJS.Timeout.unref existe; deixamos default.
}

async function flush(): Promise<void> {
  if (buffer.size === 0) return;
  const items = Array.from(buffer.values());
  buffer.clear();

  for (const item of items) {
    try {
      // Lê estado atual
      const { data: current } = await supabase
        .from("level_users")
        .select("xp,level,total_xp,messages_count")
        .eq("guild_id", item.guildId)
        .eq("user_id", item.userId)
        .maybeSingle();

      const newTotal = (current?.total_xp ?? 0) + item.totalXpDelta;
      const derived = deriveLevel(newTotal);

      await supabase.from("level_users").upsert(
        {
          guild_id: item.guildId,
          user_id: item.userId,
          username: item.username,
          xp: derived.xpInLevel,
          level: derived.level,
          total_xp: newTotal,
          messages_count: (current?.messages_count ?? 0) + item.messagesDelta,
          last_xp_at: item.lastXpAt.toISOString(),
        },
        { onConflict: "guild_id,user_id" },
      );
    } catch (err) {
      logger.warn({ err, item }, "social.xp flush falhou");
    }
  }
}

export async function handleSocialXp(msg: Message): Promise<void> {
  if (!msg.inGuild() || msg.author.bot) return;
  if (msg.system || msg.webhookId) return;
  const guildId = msg.guildId;
  const userId = msg.author.id;

  const social = await getSocialConfig(guildId);
  if (!social.enabled || !social.level_enabled) return;
  if (social.ignored_channel_ids.includes(msg.channelId)) return;
  if (msg.member && social.ignored_role_ids.some((r) => msg.member!.roles.cache.has(r))) return;

  const cfg = await getLevelConfig(guildId);
  if (!cfg.enabled) return;
  if (msg.content.trim().length < cfg.min_message_length) return;

  const k = key(guildId, userId);
  const last = cooldown.get(k) ?? 0;
  const now = Date.now();
  if (now - last < cfg.cooldown_seconds * 1000) return;
  cooldown.set(k, now);

  // Calcula XP
  const min = Math.min(cfg.min_xp_per_message, cfg.max_xp_per_message);
  const max = Math.max(cfg.min_xp_per_message, cfg.max_xp_per_message);
  const base = Math.floor(min + Math.random() * (max - min + 1));
  const vipMult = (await isVip(guildId, userId).catch(() => false)) ? Number(cfg.vip_multiplier) : 1;
  const gained = Math.max(1, Math.floor(base * Number(cfg.global_multiplier) * vipMult));

  // Acumula no buffer
  const pending = buffer.get(k) ?? {
    guildId,
    userId,
    username: msg.author.username,
    totalXpDelta: 0,
    messagesDelta: 0,
    lastXpAt: new Date(now),
  };
  pending.totalXpDelta += gained;
  pending.messagesDelta += 1;
  pending.username = msg.author.username;
  pending.lastXpAt = new Date(now);
  buffer.set(k, pending);

  // Flush antecipado se buffer grande
  if (buffer.size > MAX_BUFFER) void flush();

  ensureFlushScheduled();

  // Verificação em tempo real de level-up (sem esperar o flush)
  // Lemos total antes + gained; se atravessou limiar, anunciamos.
  const { data: snapshot } = await supabase
    .from("level_users")
    .select("total_xp,level")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .maybeSingle();
  const previousLevel = snapshot?.level ?? 0;
  const previousTotal = snapshot?.total_xp ?? 0;
  // Soma também outras entradas no buffer (incluindo a atual)
  const projectedTotal = previousTotal + pending.totalXpDelta;
  const derived = deriveLevel(projectedTotal);

  if (derived.level > previousLevel) {
    // grava imediatamente este usuário pra evitar repetir anúncio
    await flushSingle(pending);
    buffer.delete(k);
    await announceLevelUp(msg, derived.level, cfg, social).catch((err) =>
      logger.debug({ err }, "level-up announce falhou"),
    );
    if (msg.member) {
      await applyLevelRewards(msg.member, derived.level).catch((err) =>
        logger.debug({ err }, "applyLevelRewards falhou"),
      );
    }
    await supabase.from("level_logs").insert({
      guild_id: guildId,
      user_id: userId,
      action: "level_up",
      level: derived.level,
      details: { previous: previousLevel },
    });
    // Conquistas — level alcançado
    const { evaluateAchievements } = await import("./achievement.service.js");
    const { announceAchievements } = await import("./achievement.notify.js");
    const unlocked = await evaluateAchievements(msg.guild, msg.member, userId, {
      type: "level_reached",
      value: derived.level,
    }).catch(() => []);
    if (unlocked.length > 0) await announceAchievements(msg, unlocked).catch(() => {});
  }

  // Conquistas — total de mensagens (avalia depois do flush periódico, mas tentamos no momento também)
  try {
    const { evaluateAchievements } = await import("./achievement.service.js");
    const { announceAchievements } = await import("./achievement.notify.js");
    const { data: row } = await supabase
      .from("level_users")
      .select("messages_count")
      .eq("guild_id", guildId)
      .eq("user_id", userId)
      .maybeSingle();
    const total = (row?.messages_count ?? 0) + (pending.messagesDelta);
    const unlocked = await evaluateAchievements(msg.guild, msg.member, userId, {
      type: "messages_count",
      value: total,
    });
    if (unlocked.length > 0) await announceAchievements(msg, unlocked);
  } catch (err) {
    logger.debug({ err }, "achievement (messages_count) falhou");
  }
}

async function flushSingle(item: PendingXp) {
  const { data: current } = await supabase
    .from("level_users")
    .select("total_xp,messages_count")
    .eq("guild_id", item.guildId)
    .eq("user_id", item.userId)
    .maybeSingle();
  const newTotal = (current?.total_xp ?? 0) + item.totalXpDelta;
  const derived = deriveLevel(newTotal);
  await supabase.from("level_users").upsert(
    {
      guild_id: item.guildId,
      user_id: item.userId,
      username: item.username,
      xp: derived.xpInLevel,
      level: derived.level,
      total_xp: newTotal,
      messages_count: (current?.messages_count ?? 0) + item.messagesDelta,
      last_xp_at: item.lastXpAt.toISOString(),
    },
    { onConflict: "guild_id,user_id" },
  );
}

async function announceLevelUp(
  msg: Message<true>,
  level: number,
  cfg: Awaited<ReturnType<typeof getLevelConfig>>,
  _social: Awaited<ReturnType<typeof getSocialConfig>>,
) {
  if (!cfg.send_level_up_message || cfg.level_up_message_mode === "disabled") return;

  const text = applyVars(cfg.level_up_message, {
    user: `<@${msg.author.id}>`,
    level,
    server: msg.guild.name,
  });
  const embed = brandEmbed({ kind: "success", title: "📈 Subiu de nível!", description: text });

  if (cfg.level_up_message_mode === "dm") {
    await msg.author.send({ embeds: [embed] }).catch(() => {});
    return;
  }

  let channel = msg.channel;
  if (cfg.level_up_message_mode === "fixed_channel" && cfg.level_up_channel_id) {
    const c = msg.guild.channels.cache.get(cfg.level_up_channel_id);
    if (c?.isTextBased() && "send" in c) channel = c as typeof msg.channel;
  }
  if (!channel?.isTextBased() || !("send" in channel)) return;

  const sent = await channel.send({ embeds: [embed] }).catch(() => null);
  if (sent && cfg.delete_level_up_after_seconds > 0) {
    setTimeout(() => {
      sent.delete().catch(() => {});
    }, cfg.delete_level_up_after_seconds * 1000);
  }
}

export async function addXpAdmin(
  guildId: string,
  member: GuildMember,
  amount: number,
): Promise<{ level: number; totalXp: number; xpInLevel: number; xpForNext: number }> {
  const { data: current } = await supabase
    .from("level_users")
    .select("total_xp,messages_count")
    .eq("guild_id", guildId)
    .eq("user_id", member.id)
    .maybeSingle();
  const newTotal = Math.max(0, (current?.total_xp ?? 0) + amount);
  const derived = deriveLevel(newTotal);
  await supabase.from("level_users").upsert(
    {
      guild_id: guildId,
      user_id: member.id,
      username: member.user.username,
      xp: derived.xpInLevel,
      level: derived.level,
      total_xp: newTotal,
      messages_count: current?.messages_count ?? 0,
      last_xp_at: new Date().toISOString(),
    },
    { onConflict: "guild_id,user_id" },
  );
  await supabase.from("level_logs").insert({
    guild_id: guildId,
    user_id: member.id,
    action: amount >= 0 ? "xp_admin_add" : "xp_admin_remove",
    amount,
    level: derived.level,
  });
  if (amount > 0) {
    await applyLevelRewards(member, derived.level).catch(() => {});
  }
  return { level: derived.level, totalXp: newTotal, xpInLevel: derived.xpInLevel, xpForNext: derived.xpForNext };
}

export async function resetUserLevel(guildId: string, userId: string): Promise<void> {
  await supabase.from("level_users").delete().eq("guild_id", guildId).eq("user_id", userId);
  await supabase.from("level_logs").insert({
    guild_id: guildId,
    user_id: userId,
    action: "reset",
  });
}
