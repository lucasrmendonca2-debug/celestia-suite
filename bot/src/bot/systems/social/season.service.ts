/**
 * Sistema de Temporadas — XP separado por período + multiplicador opcional.
 */
import { supabase } from "../../../database/supabase.js";
import { deriveLevel } from "./formulas.js";
import { logger } from "../../utils/logger.js";

export interface SeasonRow {
  id: string;
  guild_id: string;
  name: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  xp_multiplier: number;
}

const cache = new Map<string, { row: SeasonRow | null; at: number }>();
const TTL = 60_000;

export async function getActiveSeason(guildId: string): Promise<SeasonRow | null> {
  const cached = cache.get(guildId);
  if (cached && Date.now() - cached.at < TTL) return cached.row;
  const { data } = await supabase
    .from("level_seasons")
    .select("*")
    .eq("guild_id", guildId)
    .eq("is_active", true)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = (data as SeasonRow | null) ?? null;
  cache.set(guildId, { row, at: Date.now() });
  return row;
}

export function invalidateSeasonCache(guildId: string) {
  cache.delete(guildId);
}

export async function recordSeasonXp(
  guildId: string,
  userId: string,
  baseXpGained: number,
): Promise<void> {
  try {
    const season = await getActiveSeason(guildId);
    if (!season) return;
    const now = new Date();
    if (season.ends_at && new Date(season.ends_at) < now) return;
    if (new Date(season.starts_at) > now) return;

    const gained = Math.max(1, Math.floor(baseXpGained * Number(season.xp_multiplier ?? 1)));

    const { data: current } = await supabase
      .from("level_season_users")
      .select("xp,messages_count")
      .eq("season_id", season.id)
      .eq("user_id", userId)
      .maybeSingle();

    const newXp = (current?.xp ?? 0) + gained;
    const derived = deriveLevel(newXp);

    await supabase.from("level_season_users").upsert(
      {
        season_id: season.id,
        guild_id: guildId,
        user_id: userId,
        xp: newXp,
        level: derived.level,
        messages_count: (current?.messages_count ?? 0) + 1,
      },
      { onConflict: "season_id,user_id" },
    );
  } catch (err) {
    logger.debug({ err }, "recordSeasonXp falhou");
  }
}

export async function getSeasonLeaderboard(
  seasonId: string,
  limit = 25,
): Promise<Array<{ user_id: string; xp: number; level: number; messages_count: number }>> {
  const { data } = await supabase
    .from("level_season_users")
    .select("user_id,xp,level,messages_count")
    .eq("season_id", seasonId)
    .order("xp", { ascending: false })
    .limit(limit);
  return (data as Array<{ user_id: string; xp: number; level: number; messages_count: number }>) ?? [];
}
