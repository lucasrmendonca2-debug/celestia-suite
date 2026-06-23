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

/**
 * Atomic cooldown lock via RPC. Retorna `true` se travou (pode prosseguir),
 * `false` se ainda está em cooldown. Substitui o padrão `acc.lastX = now; await acc.save()`
 * que sofre race entre dois /comandos simultâneos do mesmo usuário.
 */
export async function claimCooldown(
  guildId: string,
  userId: string,
  field: "last_daily_at" | "last_work_at" | "last_crime_at" | "last_rob_at",
  cooldownSeconds: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("economy_claim_cooldown", {
    _guild_id: guildId,
    _user_id: userId,
    _field: field,
    _cooldown_seconds: cooldownSeconds,
  });
  if (error) {
    logger.error({ err: error, guildId, userId, field }, "claimCooldown RPC falhou");
    return false;
  }
  return !!(data && typeof data === "object" && (data as any).ok === true);
}

export interface ShopBuyResult {
  ok: boolean;
  reason?: string;
  newBalance?: number;
  totalPaid?: number;
  stock?: number | null;
  item?: { id: string; name: string; role_id: string | null; type: string };
}

/**
 * Compra atômica: valida estoque + debita saldo num único bloco PL/pgSQL.
 * Substitui o padrão "decrement stock then decrement wallet" que sofre race
 * entre `/loja comprar` simultâneos.
 */
export async function shopBuyAtomic(
  guildId: string,
  userId: string,
  itemId: string,
  qty: number,
  unitPrice: number,
): Promise<ShopBuyResult> {
  const { data, error } = await supabase.rpc("shop_buy_atomic", {
    _guild_id: guildId,
    _user_id: userId,
    _item_id: itemId,
    _qty: qty,
    _unit_price: unitPrice,
  });
  if (error) {
    logger.error({ err: error, guildId, userId, itemId, qty }, "shopBuyAtomic RPC falhou");
    return { ok: false, reason: "rpc_error" };
  }
  const p = data as any;
  if (!p?.ok) return { ok: false, reason: p?.reason ?? "unknown" };
  return {
    ok: true,
    newBalance: Number(p.new_balance ?? 0),
    totalPaid: Number(p.total_paid ?? 0),
    stock: p.stock ?? null,
    item: p.item,
  };
}

/**
 * Transferência atômica entre wallet e bank — respeita bank_cap.
 * Substitui `acc.wallet -= x; acc.bank += x; await acc.save()` que sofre race.
 */
export async function bankTransferAtomic(
  guildId: string,
  userId: string,
  amount: number,
  direction: "deposit" | "withdraw",
): Promise<{ ok: boolean; reason?: string; wallet?: number; bank?: number; bankCap?: number }> {
  if (amount <= 0) return { ok: false, reason: "invalid_amount" };
  const { data, error } = await supabase.rpc("economy_bank_transfer", {
    _guild_id: guildId,
    _user_id: userId,
    _amount: amount,
    _direction: direction,
  });
  if (error) {
    logger.error({ err: error, guildId, userId, amount, direction }, "bankTransferAtomic RPC falhou");
    return { ok: false, reason: "rpc_error" };
  }
  const p = data as any;
  if (!p?.ok) return { ok: false, reason: p?.reason ?? "unknown" };
  return {
    ok: true,
    wallet: Number(p.wallet ?? 0),
    bank: Number(p.bank ?? 0),
    bankCap: p.bank_cap != null ? Number(p.bank_cap) : undefined,
  };
}


/**
 * Diária atômica: trava `last_daily_at` no banco e retorna se sucedeu.
 * O caller é responsável por creditar a recompensa (via `addWallet`) e
 * atualizar streak — mas só APÓS este RPC retornar ok.
 */
export async function dailyClaimAtomic(
  guildId: string,
  userId: string,
  cooldownSeconds: number,
  expectedStreak: number,
): Promise<{ ok: boolean; reason?: string; nextAt?: string | null; prevLastDaily?: string | null }> {
  const { data, error } = await supabase.rpc("daily_claim_atomic", {
    _guild_id: guildId,
    _user_id: userId,
    _cooldown_seconds: cooldownSeconds,
    _expected_streak: expectedStreak,
  });
  if (error) {
    logger.error({ err: error, guildId, userId }, "dailyClaimAtomic RPC falhou");
    return { ok: false, reason: "rpc_error" };
  }
  const p = data as any;
  if (!p?.ok) {
    return { ok: false, reason: p?.reason ?? "unknown", nextAt: p?.next_at ?? null };
  }
  return { ok: true, prevLastDaily: p?.prev_last_daily_at ?? null };
}
