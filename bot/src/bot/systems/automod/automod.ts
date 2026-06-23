import type { Message } from "discord.js";
import { createAutomodIncident } from "../../repositories/content.repo.js";
import { supabase } from "../../../database/supabase.js";
import { logger } from "../../utils/logger.js";

const INVITE_RE = /(discord\.gg|discord(?:app)?\.com\/invite)\/\S+/i;
const LINK_RE = /\bhttps?:\/\/\S+/i;

// memória de spam (por guild:user)
const spamMap = new Map<string, number[]>();

// cache de config (30s) — antes era 1 query Supabase POR MENSAGEM
const CFG_TTL_MS = 30_000;
const cfgCache = new Map<string, { cfg: DashboardAutoModConfig | null; at: number }>();

export function invalidateAutoModCache(guildId: string) {
  cfgCache.delete(guildId);
}

interface DashboardAutoModConfig {
  enabled: boolean;
  anti_spam_enabled: boolean;
  anti_spam_threshold: number;
  anti_spam_interval: number;
  anti_invite_enabled: boolean;
  anti_link_enabled: boolean;
  anti_caps_enabled: boolean;
  anti_caps_threshold: number;
  anti_mention_enabled: boolean;
  anti_mention_threshold: number;
  blacklist_words: string[];
  whitelist_channels: string[];
  whitelist_roles: string[];
  whitelist_users: string[];
  warn_user_on_delete: boolean;
  log_channel_id?: string | null;
}

async function getAutoModConfig(guildId: string): Promise<DashboardAutoModConfig | null> {
  const hit = cfgCache.get(guildId);
  if (hit && Date.now() - hit.at < CFG_TTL_MS) return hit.cfg;

  const { data, error } = await supabase
    .from("automod_config")
    .select("*")
    .eq("guild_id", guildId)
    .maybeSingle();
  if (error) {
    logger.warn({ err: error, guildId }, "automod: falha ao ler config — usando cache vazio por 30s");
    cfgCache.set(guildId, { cfg: null, at: Date.now() });
    return null;
  }
  const cfg = (data as DashboardAutoModConfig | null) ?? null;
  cfgCache.set(guildId, { cfg, at: Date.now() });
  return cfg;
}

export async function runAutoMod(msg: Message): Promise<boolean> {
  if (!msg.inGuild() || msg.author.bot) return false;
  const cfg = await getAutoModConfig(msg.guildId);
  if (!cfg?.enabled) return false;
  const member = msg.member;

  if (cfg.whitelist_channels?.includes(msg.channelId)) return false;
  if (cfg.whitelist_users?.includes(msg.author.id)) return false;
  if (member?.permissions.has("ManageMessages")) return false;
  if (member && cfg.whitelist_roles?.some((r) => member.roles.cache.has(r))) return false;

  const content = msg.content ?? "";

  if (cfg.anti_invite_enabled && INVITE_RE.test(content)) {
    return await act(msg, "anti-invite", "Convites de outros servidores não são permitidos.", cfg);
  }
  if (cfg.anti_link_enabled && LINK_RE.test(content)) {
    return await act(msg, "anti-link", "Links não são permitidos neste servidor.", cfg);
  }
  if (cfg.blacklist_words?.length) {
    const lower = content.toLowerCase();
    for (const w of cfg.blacklist_words) {
      if (!w) continue;
      try {
        const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        if (re.test(lower)) return await act(msg, "blacklist-word", `A palavra "${w}" não é permitida.`, cfg);
      } catch {
        /* skip bad regex */
      }
    }
  }
  if (cfg.anti_caps_enabled && content.length >= 10) {
    const letters = content.replace(/[^a-zA-ZÀ-ÿ]/g, "");
    const upper = letters.replace(/[^A-ZÀ-Ý]/g, "");
    const ratio = letters.length ? (upper.length / letters.length) * 100 : 0;
    if (ratio >= (cfg.anti_caps_threshold ?? 70)) {
      return await act(msg, "anti-caps", "Evite enviar mensagens com excesso de letras maiúsculas.", cfg);
    }
  }
  if (cfg.anti_mention_enabled) {
    const mentions = msg.mentions.users.size + msg.mentions.roles.size;
    if (mentions >= (cfg.anti_mention_threshold ?? 5)) {
      return await act(msg, "anti-mention", "Você mencionou usuários/cargos demais em uma mensagem.", cfg);
    }
  }
  if (cfg.anti_spam_enabled) {
    const key = `${msg.guildId}:${msg.author.id}`;
    const arr = spamMap.get(key) ?? [];
    const now = Date.now();
    const windowMs = (cfg.anti_spam_interval ?? 5) * 1000;
    const filtered = arr.filter((t) => now - t < windowMs);
    filtered.push(now);
    spamMap.set(key, filtered);
    if (filtered.length >= (cfg.anti_spam_threshold ?? 5)) {
      spamMap.set(key, []);
      return await act(msg, "anti-spam", "Você está enviando mensagens muito rápido. Calma!", cfg);
    }
  }
  return false;
}

async function act(
  msg: Message,
  rule: string,
  reason: string,
  cfg: DashboardAutoModConfig,
): Promise<boolean> {
  await msg.delete().catch(() => {});
  if (cfg.warn_user_on_delete) {
    const ch = msg.channel as { send?: (payload: unknown) => Promise<{ delete: () => Promise<unknown> }> };
    await ch
      .send?.({ content: `<@${msg.author.id}> ⚠️ ${reason}` })
      .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000))
      .catch(() => {});
  }

  // Persistência: tabela dedicada de incidentes + log unificado de moderação.
  await Promise.allSettled([
    createAutomodIncident({
      guildId: msg.guildId!,
      userId: msg.author.id,
      channelId: msg.channelId,
      type: rule,
      reason,
      messageId: msg.id,
      detail: { content: msg.content?.slice(0, 500) ?? "", action: "delete" },
    }),
    supabase.from("moderation_logs").insert({
      guild_id: msg.guildId!,
      user_id: msg.author.id,
      moderator_id: null,
      action: `automod:${rule}`,
      reason,
      details: {
        channel_id: msg.channelId,
        content: msg.content?.slice(0, 500) ?? "",
      },
    }),
  ]);

  return true;
}
