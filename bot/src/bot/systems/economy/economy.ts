import { EconomyAccount, VipMembership } from "../../../database/models.js";
import { getConfig } from "../../utils/guildCache.js";

export async function getAccount(guildId: string, userId: string) {
  const acc = await EconomyAccount.findOneAndUpdate(
    { guildId, userId },
    { $setOnInsert: { guildId, userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  if (!acc) throw new Error("Não foi possível carregar a conta de economia.");
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
  return currencyFromConfig(cfg);
}

export function currencyFromConfig(cfg: any) {
  return { emoji: cfg.economyCurrencyEmoji ?? "💜", name: cfg.economyCurrencyName ?? "Zen" };
}

export function canUse(last: Date | null | undefined, cooldownMs: number) {
  if (!last) return { ok: true as const, retryAt: null };
  const next = last.getTime() + cooldownMs;
  const now = Date.now();
  if (now >= next) return { ok: true as const, retryAt: null };
  return { ok: false as const, retryAt: new Date(next) };
}
