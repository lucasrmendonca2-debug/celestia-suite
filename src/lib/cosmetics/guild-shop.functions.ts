/**
 * Server functions para o dashboard de loja de cosméticos de uma guild.
 * Permite que administradores do servidor gerenciem a rotação diária,
 * criem cosméticos exclusivos da guild e vejam estatísticas de vendas.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const guildIdSchema = z.string().regex(/^\d{5,32}$/, "guild id inválido");

async function admin() {
  const { supabaseAdmin } = await import("@/lib/supabase-admin.server");
  return supabaseAdmin;
}
async function perm(guildId: string) {
  const { assertCanManageGuild } = await import("../guild/permissions.server");
  return assertCanManageGuild(guildId);
}

// ============================================================
// LISTA: catálogo + rotação + exclusivos da guild
// ============================================================
export const getGuildShopOverview = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const today = new Date().toISOString().slice(0, 10);

    const [cosmeticsRes, rotationRes, salesRes, tuningRes] = await Promise.all([
      sb.from("profile_cosmetics").select("*").order("rarity").order("name"),
      sb
        .from("cosmetic_rotations")
        .select("*")
        .eq("rotation_date", today)
        .maybeSingle(),
      sb
        .from("user_cosmetics")
        .select("cosmetic_id, source, acquired_at, metadata")
        .gte(
          "acquired_at",
          new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
        )
        .limit(500),
      sb
        .from("economy_tuning_state")
        .select("*")
        .eq("guild_id", data.guildId)
        .maybeSingle(),
    ]);

    if (cosmeticsRes.error) throw new Error(cosmeticsRes.error.message);

    // Conta vendas dos últimos 7d (apenas itens com source='shop' e metadata.guild_id)
    const salesByItem = new Map<string, number>();
    for (const row of salesRes.data ?? []) {
      const md = (row.metadata ?? {}) as { guild_id?: string };
      if (row.source === "shop" && md.guild_id === data.guildId) {
        salesByItem.set(
          row.cosmetic_id as string,
          (salesByItem.get(row.cosmetic_id as string) ?? 0) + 1,
        );
      }
    }

    return {
      cosmetics: (cosmeticsRes.data ?? []).map((c) => ({
        ...c,
        sales_7d: salesByItem.get(c.id) ?? 0,
      })),
      rotation: rotationRes.data ?? null,
      tuning: tuningRes.data ?? {
        guild_id: data.guildId,
        shop_price_multiplier: 1.0,
        daily_reward_multiplier: 1.0,
        state: "stable",
      },
      totalSales7d: Array.from(salesByItem.values()).reduce((a, b) => a + b, 0),
    };
  });

// ============================================================
// Força nova rotação (chamada manual pelo admin)
// ============================================================
export const forceRotation = createServerFn({ method: "POST" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: result, error } = await sb.rpc("rotate_daily_cosmetics", {
      _force: true,
    });
    if (error) throw new Error(error.message);
    return result as { ok: boolean; rotation_id?: string };
  });

// ============================================================
// Configura multiplicadores de preço/recompensa da guild
// ============================================================
export const setEconomyTuning = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        guildId: guildIdSchema,
        shop_price_multiplier: z.number().min(0.5).max(2.0),
        daily_reward_multiplier: z.number().min(0.5).max(2.0),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb.from("economy_tuning_state").upsert(
      {
        guild_id: data.guildId,
        shop_price_multiplier: data.shop_price_multiplier,
        daily_reward_multiplier: data.daily_reward_multiplier,
        state: "manual",
        last_tuned_at: new Date().toISOString(),
      },
      { onConflict: "guild_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// Ativa/desativa um cosmético (somente os exclusivos da guild)
// ============================================================
export const toggleGuildCosmetic = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        guildId: guildIdSchema,
        cosmeticId: z.string().uuid(),
        active: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    // só permite mexer em exclusivos da guild
    const { data: row } = await sb
      .from("profile_cosmetics")
      .select("guild_exclusive_id")
      .eq("id", data.cosmeticId)
      .maybeSingle();
    if (!row || row.guild_exclusive_id !== data.guildId) {
      throw new Error("Só itens exclusivos desse servidor podem ser alterados.");
    }
    const { error } = await sb
      .from("profile_cosmetics")
      .update({ active: data.active })
      .eq("id", data.cosmeticId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// Cria um cosmético exclusivo da guild
// ============================================================
const NewCosmetic = z.object({
  guildId: guildIdSchema,
  slug: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9_-]+$/i, "use letras, números, _ ou -"),
  name: z.string().min(1).max(80),
  description: z.string().max(300).default(""),
  type: z.enum([
    "banner",
    "frame",
    "sticker",
    "effect",
    "background_pattern",
    "badge_decoration",
  ]),
  rarity: z.enum(["common", "rare", "epic", "legendary", "seasonal"]),
  price_coins: z.number().int().min(0).max(1_000_000),
  image_url: z.string().url(),
});

export const createGuildCosmetic = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => NewCosmetic.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const slug = `g${data.guildId}-${data.slug}`.toLowerCase();
    const { data: created, error } = await sb
      .from("profile_cosmetics")
      .insert({
        slug,
        name: data.name,
        description: data.description,
        type: data.type,
        rarity: data.rarity,
        price_coins: data.price_coins,
        image_url: data.image_url,
        active: true,
        guild_exclusive_id: data.guildId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: created.id };
  });
