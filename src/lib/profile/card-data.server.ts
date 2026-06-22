/**
 * Resolução dos dados de um Profile Card a partir do userId Discord.
 * Cache em memória 60s por userId.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ProfileCardData } from "./card-svg.server";

interface CacheEntry {
  data: ProfileCardData;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 1000;

function discordAvatar(userId: string, hash: string | null): string | null {
  if (!hash) return null;
  const ext = hash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${hash}.${ext}?size=256`;
}

// Curva simples: XP para o próximo nível = 100 * (lvl + 1)^1.5
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level + 1, 1.5));
}

export async function loadProfileCardData(userId: string): Promise<ProfileCardData> {
  const cached = cache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  // 1. Loadout + cosméticos equipados
  const { data: loadout } = await supabaseAdmin
    .from("user_profile_loadout")
    .select("banner_id, frame_id, effect_id, sticker_ids, accent_color, bio")
    .eq("user_id", userId)
    .maybeSingle();

  const cosmeticIds = [
    loadout?.banner_id,
    loadout?.frame_id,
    loadout?.effect_id,
    ...(loadout?.sticker_ids ?? []),
  ].filter((x): x is string => !!x);

  const cosmeticsMap: Record<string, { image_url: string | null; name: string; rarity: string }> = {};
  if (cosmeticIds.length > 0) {
    const { data: cos } = await supabaseAdmin
      .from("profile_cosmetics")
      .select("id, image_url, name, rarity")
      .in("id", cosmeticIds);
    for (const c of cos ?? []) cosmeticsMap[c.id] = c;
  }

  // 2. Stats agregadas (todas as guilds)
  const [economyRes, levelRes, repRes] = await Promise.all([
    supabaseAdmin.from("user_economy").select("balance").eq("user_id", userId),
    supabaseAdmin
      .from("level_users")
      .select("username, level, total_xp, xp")
      .eq("user_id", userId)
      .order("total_xp", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("reputation_logs")
      .select("id", { count: "exact", head: true })
      .eq("to_user_id", userId),
  ]);

  const totalBalance = (economyRes.data ?? []).reduce(
    (a, r) => a + Number(r.balance ?? 0),
    0,
  );
  const level = levelRes.data?.level ?? 0;
  const xpInLevel = levelRes.data?.xp ?? 0;
  const xpForNext = xpForLevel(level);
  const username = levelRes.data?.username ?? `User ${userId.slice(-4)}`;
  const reputation = repRes.count ?? 0;

  // 3. Avatar Discord — tentamos achar avatar hash em qualquer lugar.
  //    Sem cache de Discord users no DB, deixamos null e renderizamos inicial.
  const avatarUrl: string | null = discordAvatar(userId, null);

  const frame = loadout?.frame_id ? cosmeticsMap[loadout.frame_id] : null;
  const banner = loadout?.banner_id ? cosmeticsMap[loadout.banner_id] : null;
  const effect = loadout?.effect_id ? cosmeticsMap[loadout.effect_id] : null;
  const stickerUrls = (loadout?.sticker_ids ?? [])
    .map((id) => cosmeticsMap[id]?.image_url)
    .filter((u): u is string => !!u);

  const data: ProfileCardData = {
    userId,
    username,
    avatarUrl,
    accentColor: loadout?.accent_color ?? "#5865F2",
    bio: loadout?.bio ?? null,
    bannerUrl: banner?.image_url ?? null,
    frameUrl: frame?.image_url ?? null,
    stickerUrls,
    effectName: effect?.name ?? null,
    level,
    xpInLevel,
    xpForNext,
    totalBalance,
    reputation,
    rarity: (frame?.rarity ?? banner?.rarity ?? null) as ProfileCardData["rarity"],
  };

  cache.set(userId, { data, expiresAt: Date.now() + TTL_MS });
  return data;
}

export function invalidateProfileCardCache(userId: string) {
  cache.delete(userId);
}
