/**
 * Phase 4 repositories — Marriage, Punishment, Giveaway, LevelAccount, Ticket, VipMembership.
 *
 * Substitui o shim Mongoose por queries diretas ao Supabase com colunas snake_case
 * e valores que respeitam os CHECK constraints reais das tabelas.
 *
 * Convenções de status reais:
 *   - marriages.status ∈ {PENDING, ACTIVE, BROKEN, REJECTED}
 *   - tickets.status   ∈ {open, claimed, pending, closed, deleted}  (lowercase)
 *   - premium_subscriptions.type ∈ {USER_VIP, GUILD_PREMIUM}
 *   - punishments.type uppercase (WARN/MUTE/.../TEMPBAN)
 */
import { supabase } from "../../database/supabase.js";
import { logger } from "../utils/logger.js";

// ============================================================
// Marriages
// ============================================================

export interface MarriageRow {
  id: string;
  guild_id: string;
  user_a_id: string;
  user_b_id: string;
  status: string;
  since: string | null;
  broken_at: string | null;
  proposed_by: string | null;
}

export async function findActiveMarriage(
  guildId: string,
  userIds: string[],
): Promise<MarriageRow | null> {
  if (userIds.length === 0) return null;
  const { data, error } = await supabase
    .from("marriages")
    .select("*")
    .eq("guild_id", guildId)
    .eq("status", "ACTIVE")
    .or(
      userIds
        .flatMap((u) => [`user_a_id.eq.${u}`, `user_b_id.eq.${u}`])
        .join(","),
    )
    .limit(1)
    .maybeSingle();
  if (error) {
    logger.warn({ err: error }, "findActiveMarriage failed");
    return null;
  }
  return data;
}

export async function createMarriage(args: {
  guildId: string;
  userA: string;
  userB: string;
  proposedBy?: string | null;
}): Promise<MarriageRow | null> {
  const { data, error } = await supabase
    .from("marriages")
    .insert({
      guild_id: args.guildId,
      user_a_id: args.userA,
      user_b_id: args.userB,
      status: "ACTIVE",
      since: new Date().toISOString(),
      proposed_by: args.proposedBy ?? null,
    })
    .select()
    .maybeSingle();
  if (error) {
    logger.warn({ err: error }, "createMarriage failed");
    return null;
  }
  return data;
}

export async function breakMarriage(id: string): Promise<void> {
  const { error } = await supabase
    .from("marriages")
    .update({ status: "BROKEN", broken_at: new Date().toISOString() })
    .eq("id", id);
  if (error) logger.warn({ err: error }, "breakMarriage failed");
}

// ============================================================
// Punishments
// ============================================================

export type PunishmentType =
  | "WARN" | "MUTE" | "TEMPMUTE" | "KICK" | "BAN" | "TEMPBAN" | "UNBAN" | "UNMUTE";

export interface PunishmentRow {
  id: number;
  guild_id: string;
  user_id: string;
  moderator_id: string;
  type: string;
  reason: string | null;
  duration_seconds: number | null;
  expires_at: string | null;
  active: boolean;
  metadata: Record<string, unknown>;
}

export async function createPunishment(args: {
  guildId: string;
  userId: string;
  moderatorId: string;
  type: PunishmentType;
  reason?: string | null;
  durationMs?: number | null;
}): Promise<PunishmentRow | null> {
  const durationSeconds = args.durationMs ? Math.floor(args.durationMs / 1000) : null;
  const { data, error } = await supabase
    .from("punishments")
    .insert({
      guild_id: args.guildId,
      user_id: args.userId,
      moderator_id: args.moderatorId,
      type: args.type,
      reason: args.reason ?? null,
      duration_seconds: durationSeconds,
      expires_at: args.durationMs ? new Date(Date.now() + args.durationMs).toISOString() : null,
      active: true,
    })
    .select()
    .maybeSingle();
  if (error) {
    logger.warn({ err: error }, "createPunishment failed");
    return null;
  }
  return data;
}

export async function findExpiredTempbans(now: Date, limit = 50): Promise<PunishmentRow[]> {
  const { data, error } = await supabase
    .from("punishments")
    .select("*")
    .eq("active", true)
    .eq("type", "TEMPBAN")
    .not("expires_at", "is", null)
    .lte("expires_at", now.toISOString())
    .limit(limit);
  if (error) {
    logger.warn({ err: error }, "findExpiredTempbans failed");
    return [];
  }
  return data ?? [];
}

export async function markPunishmentInactive(id: number): Promise<void> {
  const { error } = await supabase.from("punishments").update({ active: false }).eq("id", id);
  if (error) logger.warn({ err: error }, "markPunishmentInactive failed");
}

// ============================================================
// Giveaways
// ============================================================

export interface GiveawayRow {
  id: string;
  guild_id: string;
  channel_id: string;
  message_id: string | null;
  host_id: string;
  prize: string;
  winners_count: number;
  ends_at: string;
  ended: boolean;
  ended_at: string | null;
  requirements: Record<string, unknown>;
  participants: string[];
  winners: string[];
}

export async function createGiveaway(args: {
  guildId: string;
  channelId: string;
  hostId: string;
  prize: string;
  winnersCount: number;
  endsAt: Date;
  requirements: Record<string, unknown>;
}): Promise<GiveawayRow | null> {
  const { data, error } = await supabase
    .from("giveaways")
    .insert({
      guild_id: args.guildId,
      channel_id: args.channelId,
      host_id: args.hostId,
      prize: args.prize,
      winners_count: args.winnersCount,
      ends_at: args.endsAt.toISOString(),
      requirements: args.requirements,
      participants: [],
      winners: [],
      ended: false,
    })
    .select()
    .maybeSingle();
  if (error) {
    logger.warn({ err: error }, "createGiveaway failed");
    return null;
  }
  return data;
}

export async function findGiveawayById(id: string): Promise<GiveawayRow | null> {
  const { data, error } = await supabase.from("giveaways").select("*").eq("id", id).maybeSingle();
  if (error) {
    logger.warn({ err: error }, "findGiveawayById failed");
    return null;
  }
  return data;
}

export async function listActiveGiveaways(guildId: string, limit = 10): Promise<GiveawayRow[]> {
  const { data, error } = await supabase
    .from("giveaways")
    .select("*")
    .eq("guild_id", guildId)
    .eq("ended", false)
    .order("ends_at", { ascending: true })
    .limit(limit);
  if (error) {
    logger.warn({ err: error }, "listActiveGiveaways failed");
    return [];
  }
  return data ?? [];
}

export async function findDueGiveaways(now: Date, limit = 50): Promise<GiveawayRow[]> {
  const { data, error } = await supabase
    .from("giveaways")
    .select("*")
    .eq("ended", false)
    .lte("ends_at", now.toISOString())
    .limit(limit);
  if (error) {
    logger.warn({ err: error }, "findDueGiveaways failed");
    return [];
  }
  return data ?? [];
}

export async function updateGiveaway(
  id: string,
  patch: Partial<
    Pick<GiveawayRow, "message_id" | "participants" | "winners" | "ended" | "ended_at">
  >,
): Promise<void> {
  const { error } = await supabase.from("giveaways").update(patch).eq("id", id);
  if (error) logger.warn({ err: error }, "updateGiveaway failed");
}

// ============================================================
// Level account
// ============================================================

export interface LevelAccountRow {
  id: string;
  guild_id: string;
  user_id: string;
  xp: number;
  level: number;
  total_xp: number;
  messages_count: number;
}

export async function findLevelAccount(
  guildId: string,
  userId: string,
): Promise<LevelAccountRow | null> {
  const { data, error } = await supabase
    .from("level_users")
    .select("*")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    logger.warn({ err: error }, "findLevelAccount failed");
    return null;
  }
  return data;
}

// ============================================================
// Tickets
// ============================================================

export async function countOpenTickets(guildId: string, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .in("status", ["open", "claimed", "pending"]);
  if (error) {
    logger.warn({ err: error }, "countOpenTickets failed");
    return 0;
  }
  return count ?? 0;
}

// ============================================================
// VIP membership (premium_subscriptions / type=USER_VIP, legacy)
// ============================================================

export interface VipMembershipRow {
  id: string;
  guild_id: string | null;
  user_id: string | null;
  status: string;
  starts_at: string;
  expires_at: string | null;
  notes: string | null; // legado: tier
  active: boolean;
}

export async function findActiveUserVip(
  guildId: string,
  userId: string,
): Promise<VipMembershipRow | null> {
  const { data, error } = await supabase
    .from("premium_subscriptions")
    .select("*")
    .eq("type", "USER_VIP")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    logger.warn({ err: error }, "findActiveUserVip failed");
    return null;
  }
  return data;
}

export async function findExpiredUserVips(now: Date, limit = 100): Promise<VipMembershipRow[]> {
  const { data, error } = await supabase
    .from("premium_subscriptions")
    .select("*")
    .eq("type", "USER_VIP")
    .eq("status", "ACTIVE")
    .not("expires_at", "is", null)
    .lte("expires_at", now.toISOString())
    .limit(limit);
  if (error) {
    logger.warn({ err: error }, "findExpiredUserVips failed");
    return [];
  }
  return data ?? [];
}

export async function markVipExpired(id: string): Promise<void> {
  const { error } = await supabase
    .from("premium_subscriptions")
    .update({ status: "EXPIRED", cancelled_at: new Date().toISOString() })
    .eq("id", id);
  if (error) logger.warn({ err: error }, "markVipExpired failed");
}

export async function deactivateUserVips(guildId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("premium_subscriptions")
    .update({ status: "CANCELLED", cancelled_at: new Date().toISOString() })
    .eq("type", "USER_VIP")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .eq("status", "ACTIVE");
  if (error) logger.warn({ err: error }, "deactivateUserVips failed");
}

export type VipTier = "BRONZE" | "PRATA" | "OURO" | "DIAMANTE";
