import type { Message } from "discord.js";
import { AutoModIncident } from "../../../database/models.js";
import { getConfig } from "../../utils/guildCache.js";

const INVITE_RE = /(discord\.gg|discord(?:app)?\.com\/invite)\/\S+/i;
const LINK_RE = /\bhttps?:\/\/\S+/i;

// memória de spam
const spamMap = new Map<string, number[]>();

export async function runAutoMod(msg: Message): Promise<boolean> {
  if (!msg.inGuild() || msg.author.bot) return false;
  const cfg = await getConfig(msg.guildId);
  const member = msg.member;

  if (cfg.automodWhitelistChannels?.includes(msg.channelId)) return false;
  if (member?.permissions.has("ManageMessages")) return false;
  if (member && cfg.automodWhitelistRoles?.some((r) => member.roles.cache.has(r))) return false;

  const content = msg.content ?? "";

  if (cfg.antiInviteEnabled && INVITE_RE.test(content)) {
    return await act(msg, "anti-invite", "Convites de outros servidores não são permitidos.");
  }
  if (cfg.antiLinkEnabled && LINK_RE.test(content)) {
    return await act(msg, "anti-link", "Links não são permitidos neste servidor.");
  }
  if (cfg.blacklistedWords?.length) {
    const lower = content.toLowerCase();
    for (const w of cfg.blacklistedWords) {
      if (!w) continue;
      try {
        const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        if (re.test(lower)) return await act(msg, "blacklist-word", `A palavra "${w}" não é permitida.`);
      } catch {
        /* skip bad regex */
      }
    }
  }
  if (cfg.antiSpamEnabled) {
    const key = `${msg.guildId}:${msg.author.id}`;
    const arr = spamMap.get(key) ?? [];
    const now = Date.now();
    const windowMs = cfg.antiSpamWindowMs ?? 5000;
    const filtered = arr.filter((t) => now - t < windowMs);
    filtered.push(now);
    spamMap.set(key, filtered);
    if (filtered.length >= (cfg.antiSpamThreshold ?? 5)) {
      spamMap.set(key, []);
      return await act(msg, "anti-spam", "Você está enviando mensagens muito rápido. Calma!");
    }
  }
  return false;
}

async function act(msg: Message, rule: string, reason: string): Promise<boolean> {
  await msg.delete().catch(() => {});
  const ch = msg.channel as { send?: (payload: unknown) => Promise<{ delete: () => Promise<unknown> }> };
  await ch
    .send?.({ content: `<@${msg.author.id}> ⚠️ ${reason}` })
    .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000))
    .catch(() => {});
  await AutoModIncident.create({
    guildId: msg.guildId!,
    userId: msg.author.id,
    rule,
    action: "delete",
    content: msg.content?.slice(0, 500) ?? "",
  }).catch(() => {});
  return true;
}
