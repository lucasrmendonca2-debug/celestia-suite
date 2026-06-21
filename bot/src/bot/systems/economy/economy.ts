import { EconomyAccount, VipMembership } from "../../../database/models.js";
import { supabase } from "../../../database/supabase.js";
import { getConfig } from "../../utils/guildCache.js";
import { logger } from "../../utils/logger.js";

export async function getAccount(guildId: string, userId: string) {
  const acc = await EconomyAccount.findOneAndUpdate(
    { guildId, userId },
    { $setOnInsert: { guildId, userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  if (!acc) throw new Error("Não foi possível carregar a conta de economia.");
  return acc;
}

/**
 * Crédito atômico via RPC (`economy_credit_wallet`).
 * Cria a linha se não existir.
 */
export async function addWallet(guildId: string, userId: string, amount: number) {
  if (amount <= 0) return;
  const { error } = await supabase.rpc("economy_credit_wallet", {
    _guild_id: guildId,
    _user_id: userId,
    _amount: amount,
  });
  if (error) {
    logger.error({ err: error, guildId, userId, amount }, "addWallet RPC falhou");
    // Fallback degradado: tenta via shim
    await EconomyAccount.updateOne(
      { guildId, userId },
      { $inc: { wallet: amount }, $setOnInsert: { guildId, userId } },
      { upsert: true },
    );
  }
}

/**
 * Débito atômico via RPC (`economy_debit_wallet`).
 * Retorna `false` se saldo insuficiente — usado por `/pay`, `/shop buy`, `/rob`
 * para prevenir double-spend sob concorrência.
 */
export async function removeWallet(guildId: string, userId: string, amount: number): Promise<boolean> {
  if (amount <= 0) return false;
  const { data, error } = await supabase.rpc("economy_debit_wallet", {
    _guild_id: guildId,
    _user_id: userId,
    _amount: amount,
  });
  if (error) {
    logger.error({ err: error, guildId, userId, amount }, "removeWallet RPC falhou");
    return false;
  }
  return !!(data && typeof data === "object" && (data as any).ok === true);
}

/**
 * Transferência atômica entre carteiras — débito + crédito numa só transação.
 * Garante que `/pay` nunca duplica nem perde moedas.
 */
export async function transferWallet(
  guildId: string,
  fromUserId: string,
  toUserId: string,
  amount: number,
): Promise<{ ok: boolean; reason?: string }> {
  if (amount <= 0) return { ok: false, reason: "invalid_amount" };
  const { data, error } = await supabase.rpc("economy_transfer_wallet", {
    _guild_id: guildId,
    _from_user_id: fromUserId,
    _to_user_id: toUserId,
    _amount: amount,
  });
  if (error) {
    logger.error({ err: error, guildId, fromUserId, toUserId, amount }, "transferWallet RPC falhou");
    return { ok: false, reason: "rpc_error" };
  }
  const payload = data as any;
  return payload?.ok ? { ok: true } : { ok: false, reason: payload?.reason ?? "unknown" };
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
