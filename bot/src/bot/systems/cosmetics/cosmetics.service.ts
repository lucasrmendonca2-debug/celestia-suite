/**
 * Serviço de cosméticos de perfil — usado pelo bot.
 *
 * Encapsula consultas ao catálogo, inventário, loadout e compra atômica
 * via RPC `cosmetic_purchase`.
 */
import { supabase } from "../../../database/supabase.js";
import { logger } from "../../utils/logger.js";

export type CosmeticType =
  | "banner"
  | "frame"
  | "sticker"
  | "effect"
  | "background_pattern"
  | "badge_decoration";

export type CosmeticRarity = "common" | "rare" | "epic" | "legendary" | "seasonal";

export interface Cosmetic {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: CosmeticType;
  rarity: CosmeticRarity;
  price_coins: number;
  price_premium: number;
  image_url: string;
  preview_url: string | null;
  collection: string | null;
  vip_only: boolean;
  is_on_offer?: boolean;
  is_rare_pick?: boolean;
}

export interface UserLoadout {
  user_id: string;
  banner_id: string | null;
  frame_id: string | null;
  effect_id: string | null;
  background_pattern_id: string | null;
  sticker_ids: string[];
  accent_color: string | null;
  bio: string | null;
  card_layout: string;
}

export interface PurchaseResult {
  ok: boolean;
  reason?: string;
  price_paid?: number;
  discount?: number;
  new_balance?: number;
  needed?: number;
}

/** Catálogo público da vitrine (itens compráveis hoje). */
export async function listShop(opts?: { type?: CosmeticType; rarity?: CosmeticRarity }) {
  let q = supabase.from("cosmetic_shop_view").select("*").order("sort_order");
  if (opts?.type) q = q.eq("type", opts.type);
  if (opts?.rarity) q = q.eq("rarity", opts.rarity);
  const { data, error } = await q;
  if (error) {
    logger.warn({ err: error }, "listShop falhou");
    return [] as Cosmetic[];
  }
  return (data ?? []) as Cosmetic[];
}

/** Rotação do dia (destaques e raros temporários). */
export async function getTodayRotation() {
  const { data } = await supabase
    .from("cosmetic_rotations")
    .select("*")
    .eq("rotation_date", new Date().toISOString().slice(0, 10))
    .maybeSingle();
  return data;
}

/** Inventário de um usuário (lista de cosméticos que possui). */
export async function getUserInventory(userId: string) {
  const { data, error } = await supabase
    .from("user_cosmetics")
    .select("cosmetic_id, source, acquired_at, profile_cosmetics(*)")
    .eq("user_id", userId);
  if (error) {
    logger.warn({ err: error, userId }, "getUserInventory falhou");
    return [];
  }
  return data ?? [];
}

/** Loadout atual (o que está equipado). */
export async function getUserLoadout(userId: string): Promise<UserLoadout | null> {
  const { data } = await supabase
    .from("user_profile_loadout")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as UserLoadout | null) ?? null;
}

/** Salva o loadout (upsert). */
export async function saveUserLoadout(userId: string, patch: Partial<UserLoadout>) {
  const { error } = await supabase
    .from("user_profile_loadout")
    .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) {
    logger.warn({ err: error, userId }, "saveUserLoadout falhou");
    return false;
  }
  return true;
}

/** Compra atômica via RPC. */
export async function purchaseCosmetic(args: {
  userId: string;
  guildId: string;
  cosmeticId: string;
  useDiscount?: boolean;
}): Promise<PurchaseResult> {
  const { data, error } = await supabase.rpc("cosmetic_purchase", {
    _user_id: args.userId,
    _guild_id: args.guildId,
    _cosmetic_id: args.cosmeticId,
    _use_discount: args.useDiscount ?? true,
  });
  if (error) {
    logger.error({ err: error, ...args }, "purchaseCosmetic RPC falhou");
    return { ok: false, reason: "rpc_error" };
  }
  return data as PurchaseResult;
}

/** Concede cosmético gratuitamente (drop, gift, seasonal reward, admin). */
export async function grantCosmetic(args: {
  userId: string;
  cosmeticId: string;
  source: "drop" | "gift" | "seasonal_reward" | "admin_grant" | "vip_bonus";
  giftedBy?: string;
}) {
  const { error } = await supabase.from("user_cosmetics").insert({
    user_id: args.userId,
    cosmetic_id: args.cosmeticId,
    source: args.source,
    gifted_by: args.giftedBy ?? null,
  });
  if (error && !error.message.includes("duplicate")) {
    logger.warn({ err: error, ...args }, "grantCosmetic falhou");
    return false;
  }
  return true;
}
