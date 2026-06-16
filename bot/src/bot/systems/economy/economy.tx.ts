import { supabase } from "../../../database/supabase.js";
import { logger } from "../../utils/logger.js";

export type EconomyTxKind =
  | "daily"
  | "work"
  | "crime"
  | "rob"
  | "transfer_in"
  | "transfer_out"
  | "shop_buy"
  | "deposit"
  | "withdraw"
  | "mission_reward"
  | "admin_adjust"
  | "other";

export interface LogTxArgs {
  guildId: string;
  userId: string;
  kind: EconomyTxKind;
  amount: number; // positivo = entrada na carteira; negativo = saída
  balanceAfter?: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export async function logTx(args: LogTxArgs): Promise<void> {
  try {
    await supabase.from("economy_transactions").insert({
      guild_id: args.guildId,
      user_id: args.userId,
      kind: args.kind,
      amount: args.amount,
      balance_after: args.balanceAfter ?? null,
      reason: args.reason ?? null,
      metadata: args.metadata ?? {},
    });
  } catch (err) {
    logger.debug({ err, kind: args.kind }, "logTx falhou silenciosamente");
  }
}

export async function listTx(guildId: string, userId: string, limit = 15) {
  const { data } = await supabase
    .from("economy_transactions")
    .select("kind,amount,reason,balance_after,created_at")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
