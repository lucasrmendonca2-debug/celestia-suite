import { supabase } from "../../../database/supabase.js";
import { ShopItem } from "../../../database/models.js";
import { logger } from "../../utils/logger.js";

export interface RotationConfig {
  guild_id: string;
  enabled: boolean;
  slot_count: number;
  rotation_hours: number;
  max_discount_pct: number;
}

export interface RotationSlot {
  item_name: string;
  discount_pct: number;
  expires_at: string;
}

const DEFAULT_CFG: Omit<RotationConfig, "guild_id"> = {
  enabled: true,
  slot_count: 5,
  rotation_hours: 12,
  max_discount_pct: 40,
};

export async function getRotationConfig(guildId: string): Promise<RotationConfig> {
  const { data } = await supabase
    .from("shop_rotation_config")
    .select("*")
    .eq("guild_id", guildId)
    .maybeSingle();
  if (data) return data as RotationConfig;
  return { guild_id: guildId, ...DEFAULT_CFG };
}

export async function setRotationConfig(
  guildId: string,
  patch: Partial<Omit<RotationConfig, "guild_id">>,
): Promise<void> {
  await supabase
    .from("shop_rotation_config")
    .upsert({ guild_id: guildId, ...patch }, { onConflict: "guild_id" });
}

export async function getActiveRotation(guildId: string): Promise<RotationSlot[]> {
  const { data } = await supabase
    .from("shop_rotations")
    .select("item_name,discount_pct,expires_at")
    .eq("guild_id", guildId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(25);
  return (data as RotationSlot[] | null) ?? [];
}

/**
 * Garante uma rotação válida; se a atual expirou (ou não existe), gera uma nova
 * a partir dos itens da loja Mongo. Idempotente quando ainda dentro do prazo.
 */
export async function ensureRotation(guildId: string): Promise<RotationSlot[]> {
  const cfg = await getRotationConfig(guildId);
  if (!cfg.enabled) return [];
  const active = await getActiveRotation(guildId);
  if (active.length) return active;
  return rotateNow(guildId, cfg);
}

export async function rotateNow(
  guildId: string,
  cfg?: RotationConfig,
): Promise<RotationSlot[]> {
  const c = cfg ?? (await getRotationConfig(guildId));
  try {
    const pool = await ShopItem.find({ guildId, enabled: true }).lean();
    if (!pool.length) return [];

    // embaralha e pega N
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, c.slot_count);
    const expiresAt = new Date(Date.now() + c.rotation_hours * 3600 * 1000).toISOString();
    const rows = shuffled.map((it: any) => ({
      guild_id: guildId,
      item_name: it.name,
      discount_pct: Math.floor(Math.random() * (c.max_discount_pct + 1)),
      expires_at: expiresAt,
    }));

    // limpa expirados antigos e insere novos
    await supabase.from("shop_rotations").delete().eq("guild_id", guildId);
    await supabase.from("shop_rotations").insert(rows);
    return rows.map(({ item_name, discount_pct, expires_at }) => ({
      item_name,
      discount_pct,
      expires_at,
    }));
  } catch (err) {
    logger.debug({ err }, "rotateNow falhou");
    return [];
  }
}

/** Aplica desconto da rotação ao preço base. Retorna { price, discount_pct }. */
export function applyRotationPrice(
  basePrice: number,
  rotation: RotationSlot[],
  itemName: string,
): { price: number; discount_pct: number } {
  const slot = rotation.find((r) => r.item_name === itemName);
  if (!slot || slot.discount_pct <= 0) return { price: basePrice, discount_pct: 0 };
  const price = Math.max(0, Math.floor(basePrice * (1 - slot.discount_pct / 100)));
  return { price, discount_pct: slot.discount_pct };
}
