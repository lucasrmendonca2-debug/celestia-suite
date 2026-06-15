import { EconomyAccount, VipMembership } from "../../../database/models.js";
import { getConfig } from "../../utils/guildCache.js";

export async function getAccount(guildId: string, userId: string) {
  let acc = await EconomyAccount.findOne({ guildId, userId });
  if (!acc) acc = await EconomyAccount.create({ guildId, userId });
  return acc;
}

export async function addWallet(guildId: string, userId: string, amount: number) {
  await EconomyAccount.updateOne(
    { guildId, userId },
    { $inc: { wallet: amount }, $setOnInsert: { guildId, userId } },
    { upsert: true },
  );
}

export async function removeWallet(guildId: string, userId: string, amount: number): Promise<boolean> {
  const acc = await getAccount(guildId, userId);
  if (acc.wallet < amount) return false;
  acc.wallet -= amount;
  await acc.save();
  return true;
}

export async function isVip(guildId: string, userId: string): Promise<boolean> {
  const vip = await VipMembership.findOne({ guildId, userId, active: true });
  return !!vip;
}

export async function getCurrency(guildId: string) {
  const cfg = await getConfig(guildId);
  return { emoji: cfg.economyCurrencyEmoji ?? "💜", name: cfg.economyCurrencyName ?? "Zen" };
}

export function canUse(last: Date | null | undefined, cooldownMs: number) {
  if (!last) return { ok: true as const, retryAt: null };
  const next = last.getTime() + cooldownMs;
  const now = Date.now();
  if (now >= next) return { ok: true as const, retryAt: null };
  return { ok: false as const, retryAt: new Date(next) };
}
