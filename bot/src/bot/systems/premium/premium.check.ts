/**
 * Helpers de consulta rápida de VIP/Premium com cache curto.
 * Use em qualquer sistema (economia, level, tickets) para gates premium.
 */
import { getActiveUserSubscription, getActiveGuildSubscription } from "./premium.service.js";

const TTL_MS = 60_000;
const userCache = new Map<string, { value: boolean; at: number }>();
const guildCache = new Map<string, { value: boolean; at: number }>();

export function invalidatePremiumCache(opts?: { userId?: string; guildId?: string }) {
  if (opts?.userId) userCache.delete(opts.userId);
  if (opts?.guildId) guildCache.delete(opts.guildId);
  if (!opts) {
    userCache.clear();
    guildCache.clear();
  }
}

export async function isUserVip(userId: string): Promise<boolean> {
  const hit = userCache.get(userId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const sub = await getActiveUserSubscription(userId).catch(() => null);
  const value = !!sub && (!sub.expires_at || new Date(sub.expires_at) > new Date());
  userCache.set(userId, { value, at: Date.now() });
  return value;
}

export async function isGuildPremium(guildId: string): Promise<boolean> {
  const hit = guildCache.get(guildId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const sub = await getActiveGuildSubscription(guildId).catch(() => null);
  const value = !!sub && (!sub.expires_at || new Date(sub.expires_at) > new Date());
  guildCache.set(guildId, { value, at: Date.now() });
  return value;
}
