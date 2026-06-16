import type { Message } from "discord.js";
import { AutoModIncident } from "../../../database/models.js";
import { supabase } from "../../../database/supabase.js";

const INVITE_RE = /(discord\.gg|discord(?:app)?\.com\/invite)\/\S+/i;
const LINK_RE = /\bhttps?:\/\/\S+/i;

// memória de spam
const spamMap = new Map<string, number[]>();

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
}

async function getAutoModConfig(guildId: string): Promise<DashboardAutoModConfig | null> {
  const { data, error } = await supabase
    .from("automod_config")
    .select("*")
    .eq("guild_id", guildId)
    .maybeSingle();
  if (error) throw error;
  return (data as DashboardAutoModConfig | null) ?? null;
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
  await AutoModIncident.create({
    guildId: msg.guildId!,
    userId: msg.author.id,
    rule,
    action: "delete",
    content: msg.content?.slice(0, 500) ?? "",
  }).catch(() => {});
  return true;
}
