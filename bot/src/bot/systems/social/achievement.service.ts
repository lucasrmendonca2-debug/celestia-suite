import { supabase } from "../../../database/supabase.js";
import { awardBadge, countUserBadges } from "./badge.service.js";
import { addWallet } from "../economy/economy.js";
import { addXpAdmin } from "./xp.service.js";
import type { Guild, GuildMember } from "discord.js";

export type TriggerType =
  | "manual"
  | "messages_count"
  | "level_reached"
  | "reputation_received"
  | "badges_collected";

export interface AchievementRow {
  id: string;
  guild_id: string;
  code: string;
  name: string;
  description: string;
  emoji: string;
  points: number;
  trigger_type: TriggerType;
  trigger_value: number;
  reward_badge_id: string | null;
  reward_coins: number;
  reward_xp: number;
  hidden: boolean;
  active: boolean;
}

export interface UnlockedAchievement {
  achievement: AchievementRow;
  badgeAwarded: boolean;
}

export async function listAchievements(guildId: string, onlyActive = false): Promise<AchievementRow[]> {
  let q = supabase.from("achievements").select("*").eq("guild_id", guildId);
  if (onlyActive) q = q.eq("active", true);
  const { data } = await q.order("trigger_type").order("trigger_value");
  return (data ?? []) as AchievementRow[];
}

export async function listUserAchievements(guildId: string, userId: string) {
  const { data } = await supabase
    .from("user_achievements")
    .select("achievement:achievements(*), unlocked_at, progress")
    .eq("guild_id", guildId)
    .eq("user_id", userId);
  return data ?? [];
}

async function isUnlocked(guildId: string, userId: string, achievementId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_achievements")
    .select("id")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .eq("achievement_id", achievementId)
    .maybeSingle();
  return !!data;
}

async function unlock(
  guild: Guild,
  member: GuildMember | null,
  userId: string,
  achievement: AchievementRow,
): Promise<UnlockedAchievement> {
  await supabase.from("user_achievements").insert({
    guild_id: guild.id,
    user_id: userId,
    achievement_id: achievement.id,
    progress: achievement.trigger_value,
  });

  let badgeAwarded = false;
  if (achievement.reward_badge_id) {
    badgeAwarded = await awardBadge(
      guild.id,
      userId,
      achievement.reward_badge_id,
      "achievement",
      `Conquista: ${achievement.name}`,
    );
  }
  if (achievement.reward_coins > 0) {
    await addWallet(guild.id, userId, achievement.reward_coins).catch(() => {});
  }
  if (achievement.reward_xp > 0 && member) {
    await addXpAdmin(guild.id, member, achievement.reward_xp).catch(() => {});
  }
  await supabase.from("level_logs").insert({
    guild_id: guild.id,
    user_id: userId,
    action: "achievement_unlocked",
    details: { achievement_id: achievement.id, code: achievement.code, name: achievement.name },
  });
  return { achievement, badgeAwarded };
}

/** Avalia conquistas automáticas. event = info contextual do que disparou. */
export async function evaluateAchievements(
  guild: Guild,
  member: GuildMember | null,
  userId: string,
  event: { type: TriggerType; value: number },
): Promise<UnlockedAchievement[]> {
  if (event.type === "manual") return [];
  const candidates = await listAchievements(guild.id, true);
  const matching = candidates.filter(
    (a) => a.trigger_type === event.type && a.trigger_value > 0 && event.value >= a.trigger_value,
  );
  if (matching.length === 0) return [];

  const unlocked: UnlockedAchievement[] = [];
  for (const a of matching) {
    if (await isUnlocked(guild.id, userId, a.id)) continue;
    try {
      const u = await unlock(guild, member, userId, a);
      unlocked.push(u);
    } catch {
      /* ignora duplicação por race condition */
    }
  }
  return unlocked;
}

/** Conquista manual entregue por admin/comando. */
export async function unlockManual(
  guild: Guild,
  member: GuildMember | null,
  userId: string,
  achievementId: string,
): Promise<UnlockedAchievement | null> {
  const { data } = await supabase
    .from("achievements")
    .select("*")
    .eq("id", achievementId)
    .eq("guild_id", guild.id)
    .maybeSingle();
  if (!data) return null;
  if (await isUnlocked(guild.id, userId, achievementId)) return null;
  return unlock(guild, member, userId, data as AchievementRow);
}

/** Calcula valor atual de cada métrica para um usuário (usado nas avaliações). */
export async function getUserMetrics(guildId: string, userId: string) {
  const { data: lvl } = await supabase
    .from("level_users")
    .select("level,messages_count,total_xp")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .maybeSingle();
  const { data: profile } = await supabase
    .from("social_profiles")
    .select("reputation")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .maybeSingle();
  const badges = await countUserBadges(guildId, userId);
  return {
    level: lvl?.level ?? 0,
    messages_count: lvl?.messages_count ?? 0,
    total_xp: lvl?.total_xp ?? 0,
    reputation: profile?.reputation ?? 0,
    badges_collected: badges,
  };
}
