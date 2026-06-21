import { supabase } from "../../../database/supabase.js";

export type PunishmentType =
  | "BAN"
  | "TEMP_BAN"
  | "KICK"
  | "MUTE"
  | "TEMP_MUTE"
  | "WARN"
  | "CLEAR"
  | "LOCK"
  | "UNLOCK"
  | "SLOWMODE"
  | "UNBAN"
  | "UNMUTE"
  | "NICKNAME";

export interface ModerationConfig {
  guild_id: string;
  enabled: boolean;
  log_channel_id: string | null;
  mute_role_id: string | null;
  max_warnings: number;
  default_warn_punishment:
    | "none"
    | "mute"
    | "kick"
    | "ban"
    | "temp_mute"
    | "temp_ban";
  default_warn_punishment_duration: number;
  default_mute_duration: number;
  allow_temporary_ban: boolean;
  allow_temporary_mute: boolean;
  delete_punished_messages: boolean;
  dm_punished_user: boolean;
  punishment_dm_template: string;
  protected_role_ids: string[];
  protected_user_ids: string[];
  embed_color: number;
  embed_footer: string;
  embed_icon_url: string | null;
  enabled_log_events: string[];
  warn_expiry_days: number;
  appeal_url: string | null;
  warn_points_low: number;
  warn_points_medium: number;
  warn_points_high: number;
  logs_retention_days: number;
  audit_log_enabled: boolean;
}

const DEFAULT_CONFIG: Omit<ModerationConfig, "guild_id"> = {
  enabled: false,
  log_channel_id: null,
  mute_role_id: null,
  max_warnings: 3,
  default_warn_punishment: "none",
  default_warn_punishment_duration: 3600,
  default_mute_duration: 600,
  allow_temporary_ban: true,
  allow_temporary_mute: true,
  delete_punished_messages: false,
  dm_punished_user: true,
  punishment_dm_template:
    "Você recebeu **{action}** em **{guild}**.\n\n**Motivo:** {reason}\n**Duração:** {duration}",
  protected_role_ids: [],
  protected_user_ids: [],
  embed_color: 15548997,
  embed_footer: "Sistema de Moderação",
  embed_icon_url: null,
  enabled_log_events: [
    "ban", "unban", "kick", "mute", "unmute", "warn", "removewarn",
    "clear", "lock", "unlock", "slowmode", "automod", "config_change",
    "note", "purge", "nickname",
  ],
  warn_expiry_days: 90,
  appeal_url: null,
  warn_points_low: 1,
  warn_points_medium: 2,
  warn_points_high: 3,
  logs_retention_days: 180,
  audit_log_enabled: true,
};

export async function getModerationConfig(guildId: string): Promise<ModerationConfig> {
  const { data, error } = await supabase
    .from("moderation_configs")
    .select("*")
    .eq("guild_id", guildId)
    .maybeSingle();
  if (error) throw error;
  return (data as ModerationConfig | null) ?? { guild_id: guildId, ...DEFAULT_CONFIG };
}

export interface ModerationPermissionRole {
  role_id: string;
  can_use_moderation: boolean;
  can_ban: boolean;
  can_unban: boolean;
  can_kick: boolean;
  can_mute: boolean;
  can_unmute: boolean;
  can_warn: boolean;
  can_remove_warn: boolean;
  can_clear_messages: boolean;
  can_lock_channel: boolean;
  can_unlock_channel: boolean;
  can_manage_automod: boolean;
  can_view_history: boolean;
  can_view_logs: boolean;
  can_manage_blacklist: boolean;
  can_manage_moderation_config: boolean;
}

export async function listPermissionRoles(
  guildId: string,
): Promise<ModerationPermissionRole[]> {
  const { data, error } = await supabase
    .from("moderation_permission_roles")
    .select("*")
    .eq("guild_id", guildId);
  if (error) throw error;
  return (data as ModerationPermissionRole[] | null) ?? [];
}

export interface CreatePunishmentArgs {
  guildId: string;
  userId: string;
  username?: string | null;
  moderatorId: string;
  moderatorName?: string | null;
  type: PunishmentType;
  reason?: string | null;
  durationSeconds?: number | null;
  metadata?: Record<string, unknown>;
}

export async function createPunishment(args: CreatePunishmentArgs) {
  const expires_at = args.durationSeconds
    ? new Date(Date.now() + args.durationSeconds * 1000).toISOString()
    : null;
  const { data, error } = await supabase
    .from("punishments")
    .insert({
      guild_id: args.guildId,
      user_id: args.userId,
      username: args.username ?? null,
      moderator_id: args.moderatorId,
      moderator_name: args.moderatorName ?? null,
      type: args.type,
      reason: args.reason ?? null,
      duration_seconds: args.durationSeconds ?? null,
      expires_at,
      active: true,
      metadata: args.metadata ?? {},
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export type WarnSeverity = "LOW" | "MEDIUM" | "HIGH";

export async function createWarning(args: {
  guildId: string;
  userId: string;
  username?: string | null;
  moderatorId: string;
  moderatorName?: string | null;
  reason?: string | null;
  severity?: WarnSeverity;
  points?: number;
  proofUrl?: string | null;
  expiresAt?: Date | null;
}) {
  const { data, error } = await supabase
    .from("warnings")
    .insert({
      guild_id: args.guildId,
      user_id: args.userId,
      username: args.username ?? null,
      moderator_id: args.moderatorId,
      moderator_name: args.moderatorName ?? null,
      reason: args.reason ?? null,
      severity: args.severity ?? "MEDIUM",
      points: args.points ?? 1,
      proof_url: args.proofUrl ?? null,
      expires_at: args.expiresAt?.toISOString() ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function sumActiveWarnPoints(guildId: string, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("warnings")
    .select("points")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .eq("active", true);
  if (error) throw error;
  return (data ?? []).reduce((acc, w) => acc + ((w.points as number | null) ?? 1), 0);
}

export async function countActiveWarnings(guildId: string, userId: string) {
  const { count, error } = await supabase
    .from("warnings")
    .select("id", { count: "exact", head: true })
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .eq("active", true);
  if (error) throw error;
  return count ?? 0;
}

export async function deactivateWarning(id: number, guildId: string) {
  const { error } = await supabase
    .from("warnings")
    .update({ active: false })
    .eq("id", id)
    .eq("guild_id", guildId);
  if (error) throw error;
}

export async function listUserWarnings(guildId: string, userId: string) {
  const { data, error } = await supabase
    .from("warnings")
    .select("*")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function logModerationEvent(args: {
  guildId: string;
  userId?: string | null;
  moderatorId?: string | null;
  action: string;
  reason?: string | null;
  details?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("moderation_logs").insert({
    guild_id: args.guildId,
    user_id: args.userId ?? null,
    moderator_id: args.moderatorId ?? null,
    action: args.action,
    reason: args.reason ?? null,
    details: args.details ?? {},
  });
  if (error) throw error;
}

export async function scheduleTemporaryAction(args: {
  guildId: string;
  userId: string;
  actionType: "TEMP_BAN" | "TEMP_MUTE";
  expiresAt: Date;
  punishmentId?: number | null;
}) {
  const { error } = await supabase.from("temporary_actions").insert({
    guild_id: args.guildId,
    user_id: args.userId,
    action_type: args.actionType,
    expires_at: args.expiresAt.toISOString(),
    active: true,
    punishment_id: args.punishmentId ?? null,
  });
  if (error) throw error;
}

export async function listExpiredTemporaryActions() {
  const { data, error } = await supabase
    .from("temporary_actions")
    .select("*")
    .eq("active", true)
    .lte("expires_at", new Date().toISOString());
  if (error) throw error;
  return data ?? [];
}

export async function deactivateTemporaryAction(id: number) {
  await supabase.from("temporary_actions").update({ active: false }).eq("id", id);
}

export async function deactivatePunishmentsByType(
  guildId: string,
  userId: string,
  types: PunishmentType[],
) {
  await supabase
    .from("punishments")
    .update({ active: false })
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .in("type", types)
    .eq("active", true);
}
