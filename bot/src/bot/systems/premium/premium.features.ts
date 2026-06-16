import { getActiveGuildSubscription, getActiveUserSubscription, getPlan } from "./premium.service.js";
import type { PremiumPlan } from "./premium.types.js";

const planCache = new Map<string, { plan: PremiumPlan | null; at: number }>();
const PLAN_TTL = 60_000;

async function cachedPlan(id: string): Promise<PremiumPlan | null> {
  const hit = planCache.get(id);
  if (hit && Date.now() - hit.at < PLAN_TTL) return hit.plan;
  const plan = await getPlan(id);
  planCache.set(id, { plan, at: Date.now() });
  return plan;
}

export async function isUserVip(userId: string): Promise<boolean> {
  const sub = await getActiveUserSubscription(userId);
  if (!sub) return false;
  if (sub.expires_at && new Date(sub.expires_at) < new Date()) return false;
  return true;
}

export async function isGuildPremium(guildId: string): Promise<boolean> {
  const sub = await getActiveGuildSubscription(guildId);
  if (!sub) return false;
  if (sub.expires_at && new Date(sub.expires_at) < new Date()) return false;
  return true;
}

export async function getUserVipPlan(userId: string): Promise<PremiumPlan | null> {
  const sub = await getActiveUserSubscription(userId);
  if (!sub) return null;
  if (sub.expires_at && new Date(sub.expires_at) < new Date()) return null;
  return cachedPlan(sub.plan_id);
}

export async function getGuildPremiumPlan(guildId: string): Promise<PremiumPlan | null> {
  const sub = await getActiveGuildSubscription(guildId);
  if (!sub) return null;
  if (sub.expires_at && new Date(sub.expires_at) < new Date()) return null;
  return cachedPlan(sub.plan_id);
}

function pickFlag(features: Record<string, unknown> | undefined, key: string): unknown {
  if (!features) return undefined;
  return features[key];
}

/** Retorna true se a feature está liberada para o usuário (VIP) OU para a guild (premium). */
export async function hasPremiumFeature(
  guildId: string | null | undefined,
  userId: string | null | undefined,
  featureKey: string,
): Promise<boolean> {
  if (userId) {
    const plan = await getUserVipPlan(userId);
    if (plan && Boolean(pickFlag(plan.features, featureKey))) return true;
  }
  if (guildId) {
    const plan = await getGuildPremiumPlan(guildId);
    if (plan && Boolean(pickFlag(plan.features, featureKey))) return true;
  }
  return false;
}

/** Retorna o multiplicador numérico (1 se não houver). */
export async function getUserVipMultiplier(
  userId: string,
  _guildId: string | null | undefined,
  type: "daily" | "work" | "crime" | "xp",
): Promise<number> {
  const plan = await getUserVipPlan(userId);
  if (!plan) return 1;
  const key = type === "xp" ? "level.multiplier.xp" : `economy.multiplier.${type}`;
  const v = pickFlag(plan.features, key);
  if (typeof v === "number" && v > 0) return v;
  return 1;
}

/** Limites configuráveis por plano de guild (cai no fallback FREE). */
const FREE_LIMITS: Record<string, number> = {
  "tickets.categories": 3,
  "shop.items": 10,
  "badges.custom": 5,
  "level.rewards": 5,
  "automations": 5,
};

export async function getGuildLimit(guildId: string, limitKey: string): Promise<number> {
  const plan = await getGuildPremiumPlan(guildId);
  const fromPlan = plan?.limits?.[limitKey];
  if (typeof fromPlan === "number" && fromPlan > 0) return fromPlan;
  return FREE_LIMITS[limitKey] ?? 0;
}
