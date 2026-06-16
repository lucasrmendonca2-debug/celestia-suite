import { supabase } from "../../../database/supabase.js";

export interface BadgeRow {
  id: string;
  guild_id: string;
  code: string;
  name: string;
  description: string;
  emoji: string;
  icon_url: string | null;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
  color: string;
  hidden: boolean;
}

export async function listBadges(guildId: string): Promise<BadgeRow[]> {
  const { data } = await supabase.from("badges").select("*").eq("guild_id", guildId).order("created_at");
  return (data ?? []) as BadgeRow[];
}

export async function getBadgeByCode(guildId: string, code: string): Promise<BadgeRow | null> {
  const { data } = await supabase
    .from("badges")
    .select("*")
    .eq("guild_id", guildId)
    .eq("code", code)
    .maybeSingle();
  return (data as BadgeRow | null) ?? null;
}

export async function listUserBadges(guildId: string, userId: string): Promise<BadgeRow[]> {
  const { data } = await supabase
    .from("user_badges")
    .select("badge:badges(*)")
    .eq("guild_id", guildId)
    .eq("user_id", userId);
  return ((data ?? []).map((r: any) => r.badge).filter(Boolean) as BadgeRow[]);
}

/** Concede uma badge a um usuário (idempotente). Retorna true se foi a primeira vez. */
export async function awardBadge(
  guildId: string,
  userId: string,
  badgeId: string,
  awardedBy?: string | null,
  reason?: string | null,
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("user_badges")
    .select("id")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .eq("badge_id", badgeId)
    .maybeSingle();
  if (existing) return false;
  await supabase.from("user_badges").insert({
    guild_id: guildId,
    user_id: userId,
    badge_id: badgeId,
    awarded_by: awardedBy ?? null,
    reason: reason ?? null,
  });
  return true;
}

export async function revokeBadge(guildId: string, userId: string, badgeId: string): Promise<void> {
  await supabase
    .from("user_badges")
    .delete()
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .eq("badge_id", badgeId);
}

export async function countUserBadges(guildId: string, userId: string): Promise<number> {
  const { count } = await supabase
    .from("user_badges")
    .select("id", { count: "exact", head: true })
    .eq("guild_id", guildId)
    .eq("user_id", userId);
  return count ?? 0;
}
