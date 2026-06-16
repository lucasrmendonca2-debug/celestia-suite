import { supabase } from "../../../database/supabase.js";
import { getProfile } from "./profile.service.js";

const REP_COOLDOWN_HOURS = 12;
const recent = new Map<string, number>(); // key guild:from → epoch ms

export interface RepResult {
  ok: boolean;
  remainingMs?: number;
  newRep?: number;
}

export async function giveReputation(
  guildId: string,
  fromUserId: string,
  toUserId: string,
  message?: string | null,
): Promise<RepResult> {
  if (fromUserId === toUserId) return { ok: false, remainingMs: 0 };
  const key = `${guildId}:${fromUserId}`;
  const last = recent.get(key) ?? 0;
  const cooldownMs = REP_COOLDOWN_HOURS * 60 * 60 * 1000;
  if (Date.now() - last < cooldownMs) {
    // confere no banco também
    const since = new Date(Date.now() - cooldownMs).toISOString();
    const { count } = await supabase
      .from("reputation_logs")
      .select("id", { count: "exact", head: true })
      .eq("guild_id", guildId)
      .eq("from_user_id", fromUserId)
      .gte("created_at", since);
    if ((count ?? 0) > 0) {
      return { ok: false, remainingMs: cooldownMs - (Date.now() - last) };
    }
  }
  recent.set(key, Date.now());

  const profile = await getProfile(guildId, toUserId);
  const newRep = profile.reputation + 1;
  await supabase.from("social_profiles").upsert(
    {
      guild_id: guildId,
      user_id: toUserId,
      reputation: newRep,
      bio: profile.bio,
      title: profile.title,
      color: profile.color,
      banner_url: profile.banner_url,
      selected_badges: profile.selected_badges,
    },
    { onConflict: "guild_id,user_id" },
  );
  await supabase.from("reputation_logs").insert({
    guild_id: guildId,
    from_user_id: fromUserId,
    to_user_id: toUserId,
    message: message ?? null,
  });
  return { ok: true, newRep };
}

export async function getTopReputation(guildId: string, limit = 10) {
  const { data } = await supabase
    .from("social_profiles")
    .select("user_id,reputation")
    .eq("guild_id", guildId)
    .order("reputation", { ascending: false })
    .limit(limit);
  return data ?? [];
}
