/**
 * Server functions do sistema de perfil pessoal do usuário (cosméticos equipados,
 * inventário, bio, accent_color e compras). Auth via sessão Discord; queries via
 * supabaseAdmin (RLS validada manualmente pelo userId da sessão).
 */
import { createServerFn } from "@tanstack/react-start";
import { getCurrentUser } from "@/lib/auth/auth.functions";
import { supabaseAdmin } from "@/lib/supabase-admin.server";

export type ProfileSlot = "banner" | "frame" | "effect" | "background_pattern";

const VALID_SLOTS: ProfileSlot[] = ["banner", "frame", "effect", "background_pattern"];
const SLOT_COLUMN: Record<ProfileSlot, string> = {
  banner: "banner_id",
  frame: "frame_id",
  effect: "effect_id",
  background_pattern: "background_pattern_id",
};
const MAX_STICKERS = 3;

export interface CosmeticDTO {
  id: string;
  type: string;
  slug: string;
  name: string;
  description: string | null;
  rarity: string;
  image_url: string | null;
  preview_url: string | null;
  collection: string | null;
}

export interface InventoryEntryDTO {
  id: string;
  cosmetic: CosmeticDTO;
  acquired_at: string;
  source: string | null;
}

export interface WalletDTO {
  guild_id: string;
  guild_name: string | null;
  guild_icon: string | null;
  balance: number;
}

export interface ProfileDTO {
  user: { id: string; username: string; globalName: string | null; avatar: string | null };
  loadout: {
    banner: CosmeticDTO | null;
    frame: CosmeticDTO | null;
    effect: CosmeticDTO | null;
    background_pattern: CosmeticDTO | null;
    stickers: CosmeticDTO[];
    bio: string | null;
    accent_color: string;
    card_layout: string;
  };
  inventory: InventoryEntryDTO[];
  wallets: WalletDTO[];
  totalBalance: number;
}

async function requireSessionUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("not_authenticated");
  return user;
}

async function fetchCosmeticsByIds(ids: string[]): Promise<Record<string, CosmeticDTO>> {
  if (ids.length === 0) return {};
  const { data, error } = await supabaseAdmin
    .from("profile_cosmetics")
    .select("id, type, slug, name, description, rarity, image_url, preview_url, collection")
    .in("id", ids);
  if (error) throw new Error(error.message);
  const map: Record<string, CosmeticDTO> = {};
  for (const row of data ?? []) {
    map[row.id] = row as CosmeticDTO;
  }
  return map;
}

function mapCosmetic(map: Record<string, CosmeticDTO>, id: string | null | undefined) {
  if (!id) return null;
  return map[id] ?? null;
}

export const getMyProfile = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProfileDTO> => {
    const user = await requireSessionUser();

    // 1. Loadout (cria default se não existir)
    let { data: loadout, error: loadoutErr } = await supabaseAdmin
      .from("user_profile_loadout")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (loadoutErr) throw new Error(loadoutErr.message);

    if (!loadout) {
      const { data: created, error: createErr } = await supabaseAdmin
        .from("user_profile_loadout")
        .insert({ user_id: user.id, sticker_ids: [], accent_color: "#5865F2" })
        .select("*")
        .single();
      if (createErr) throw new Error(createErr.message);
      loadout = created;
    }

    // 2. Inventário
    const { data: invRaw, error: invErr } = await supabaseAdmin
      .from("user_cosmetics")
      .select("id, cosmetic_id, acquired_at, source")
      .eq("user_id", user.id)
      .order("acquired_at", { ascending: false });
    if (invErr) throw new Error(invErr.message);

    // 3. Resolve todos os ids de cosméticos (inventário + loadout)
    const allIds = new Set<string>();
    for (const r of invRaw ?? []) if (r.cosmetic_id) allIds.add(r.cosmetic_id);
    for (const slot of VALID_SLOTS) {
      const id = (loadout as any)[SLOT_COLUMN[slot]];
      if (id) allIds.add(id);
    }
    for (const sid of loadout.sticker_ids ?? []) allIds.add(sid);

    const cosmeticsMap = await fetchCosmeticsByIds([...allIds]);

    const inventory: InventoryEntryDTO[] = (invRaw ?? [])
      .map((r) => {
        const c = cosmeticsMap[r.cosmetic_id];
        if (!c) return null;
        return {
          id: r.id,
          cosmetic: c,
          acquired_at: r.acquired_at,
          source: r.source,
        };
      })
      .filter(Boolean) as InventoryEntryDTO[];

    const stickers = (loadout.sticker_ids ?? [])
      .map((sid) => cosmeticsMap[sid])
      .filter(Boolean) as CosmeticDTO[];

    // 4. Carteiras
    const { data: walletsRaw } = await supabaseAdmin
      .from("user_economy")
      .select("guild_id, balance")
      .eq("user_id", user.id)
      .order("balance", { ascending: false });

    const guildIds = (walletsRaw ?? []).map((w) => w.guild_id);
    const guildsMap: Record<string, { name: string | null; icon: string | null }> = {};
    if (guildIds.length > 0) {
      const { data: guildsData } = await supabaseAdmin
        .from("bot_guild_presence")
        .select("guild_id, name, icon")
        .in("guild_id", guildIds);
      for (const g of guildsData ?? []) {
        guildsMap[g.guild_id] = { name: g.name, icon: g.icon };
      }
    }

    const wallets: WalletDTO[] = (walletsRaw ?? []).map((w) => ({
      guild_id: w.guild_id,
      guild_name: guildsMap[w.guild_id]?.name ?? null,
      guild_icon: guildsMap[w.guild_id]?.icon ?? null,
      balance: Number(w.balance ?? 0),
    }));
    const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

    return {
      user: {
        id: user.id,
        username: user.username,
        globalName: user.globalName,
        avatar: user.avatar,
      },
      loadout: {
        banner: mapCosmetic(cosmeticsMap, loadout.banner_id),
        frame: mapCosmetic(cosmeticsMap, loadout.frame_id),
        effect: mapCosmetic(cosmeticsMap, loadout.effect_id),
        background_pattern: mapCosmetic(cosmeticsMap, loadout.background_pattern_id),
        stickers,
        bio: loadout.bio,
        accent_color: loadout.accent_color ?? "#5865F2",
        card_layout: loadout.card_layout ?? "default",
      },
      inventory,
      wallets,
      totalBalance,
    };
  },
);

export const equipCosmetic = createServerFn({ method: "POST" })
  .inputValidator((input: { cosmeticId: string; slot?: ProfileSlot | "sticker" }) => input)
  .handler(async ({ data }) => {
    const user = await requireSessionUser();

    // valida posse
    const { data: owned } = await supabaseAdmin
      .from("user_cosmetics")
      .select("id")
      .eq("user_id", user.id)
      .eq("cosmetic_id", data.cosmeticId)
      .maybeSingle();
    if (!owned) throw new Error("not_owned");

    // descobre tipo do cosmético
    const { data: cos } = await supabaseAdmin
      .from("profile_cosmetics")
      .select("id, type")
      .eq("id", data.cosmeticId)
      .maybeSingle();
    if (!cos) throw new Error("cosmetic_not_found");

    if (cos.type === "sticker") {
      const { data: loadout } = await supabaseAdmin
        .from("user_profile_loadout")
        .select("sticker_ids")
        .eq("user_id", user.id)
        .maybeSingle();
      const current = loadout?.sticker_ids ?? [];
      if (current.includes(data.cosmeticId)) {
        return { ok: true, already: true };
      }
      const next = [...current, data.cosmeticId].slice(-MAX_STICKERS);
      const { error } = await supabaseAdmin
        .from("user_profile_loadout")
        .upsert({ user_id: user.id, sticker_ids: next });
      if (error) throw new Error(error.message);
      return { ok: true, sticker_ids: next };
    }

    const slot = cos.type as ProfileSlot;
    if (!VALID_SLOTS.includes(slot)) throw new Error("invalid_slot");
    const column = SLOT_COLUMN[slot];
    const { error } = await supabaseAdmin
      .from("user_profile_loadout")
      .upsert({ user_id: user.id, [column]: data.cosmeticId } as any);
    if (error) throw new Error(error.message);
    return { ok: true, slot, cosmeticId: data.cosmeticId };
  });

export const unequipCosmetic = createServerFn({ method: "POST" })
  .inputValidator((input: { slot: ProfileSlot | "sticker"; cosmeticId?: string }) => input)
  .handler(async ({ data }) => {
    const user = await requireSessionUser();

    if (data.slot === "sticker") {
      if (!data.cosmeticId) throw new Error("cosmetic_id_required");
      const { data: loadout } = await supabaseAdmin
        .from("user_profile_loadout")
        .select("sticker_ids")
        .eq("user_id", user.id)
        .maybeSingle();
      const next = (loadout?.sticker_ids ?? []).filter((id) => id !== data.cosmeticId);
      const { error } = await supabaseAdmin
        .from("user_profile_loadout")
        .upsert({ user_id: user.id, sticker_ids: next });
      if (error) throw new Error(error.message);
      return { ok: true, sticker_ids: next };
    }

    if (!VALID_SLOTS.includes(data.slot)) throw new Error("invalid_slot");
    const column = SLOT_COLUMN[data.slot];
    const { error } = await supabaseAdmin
      .from("user_profile_loadout")
      .upsert({ user_id: user.id, [column]: null } as any);
    if (error) throw new Error(error.message);
    return { ok: true, slot: data.slot };
  });

export const updateProfileMeta = createServerFn({ method: "POST" })
  .inputValidator((input: { bio?: string | null; accentColor?: string }) => input)
  .handler(async ({ data }) => {
    const user = await requireSessionUser();
    const patch: Record<string, unknown> = { user_id: user.id };
    if (data.bio !== undefined) {
      const trimmed = data.bio?.trim() ?? "";
      patch.bio = trimmed.length === 0 ? null : trimmed.slice(0, 200);
    }
    if (data.accentColor !== undefined) {
      const hex = data.accentColor.trim();
      if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error("invalid_color");
      patch.accent_color = hex;
    }
    const { error } = await supabaseAdmin.from("user_profile_loadout").upsert(patch as any);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const purchaseProfileCosmetic = createServerFn({ method: "POST" })
  .inputValidator((input: { cosmeticId: string; guildId: string; useDiscount?: boolean }) => input)
  .handler(async ({ data }) => {
    const user = await requireSessionUser();
    const { data: result, error } = await supabaseAdmin.rpc("cosmetic_purchase", {
      _user_id: user.id,
      _guild_id: data.guildId,
      _cosmetic_id: data.cosmeticId,
      _use_discount: data.useDiscount ?? false,
    });
    if (error) throw new Error(error.message);
    return result as { ok: boolean; reason?: string; price_paid?: number; new_balance?: number };
  });
