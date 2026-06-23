import { supabase } from "../../database/supabase.js";
import { logger } from "../utils/logger.js";

// ============================================================
// Embed templates
// ============================================================

export interface EmbedTemplateRow {
  id: string;
  guild_id: string;
  name: string;
  embed: Record<string, unknown>;
  created_by: string | null;
}

export async function upsertEmbedTemplate(
  guildId: string,
  name: string,
  embed: Record<string, unknown>,
  createdBy: string,
) {
  const { error } = await supabase
    .from("embed_templates")
    .upsert(
      { guild_id: guildId, name, embed, created_by: createdBy },
      { onConflict: "guild_id,name" },
    );
  if (error) throw error;
}

export async function getEmbedTemplate(guildId: string, name: string): Promise<EmbedTemplateRow | null> {
  const { data, error } = await supabase
    .from("embed_templates")
    .select("*")
    .eq("guild_id", guildId)
    .eq("name", name)
    .maybeSingle();
  if (error) throw error;
  return (data as EmbedTemplateRow | null) ?? null;
}

export async function listEmbedTemplates(guildId: string, limit = 25): Promise<EmbedTemplateRow[]> {
  const { data, error } = await supabase
    .from("embed_templates")
    .select("*")
    .eq("guild_id", guildId)
    .order("name")
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as EmbedTemplateRow[];
}

// ============================================================
// Custom commands
// ============================================================

export interface CustomCommandRow {
  id: string;
  guild_id: string;
  name: string;
  response_text: string | null;
  embed: Record<string, unknown> | null;
  enabled: boolean;
  uses: number;
  required_roles: string[];
  created_by: string | null;
}

export async function countCustomCommands(guildId: string): Promise<number> {
  const { count, error } = await supabase
    .from("custom_commands")
    .select("id", { count: "exact", head: true })
    .eq("guild_id", guildId);
  if (error) throw error;
  return count ?? 0;
}

export async function getCustomCommand(
  guildId: string,
  name: string,
  opts: { onlyEnabled?: boolean } = {},
): Promise<CustomCommandRow | null> {
  let q = supabase
    .from("custom_commands")
    .select("*")
    .eq("guild_id", guildId)
    .eq("name", name);
  if (opts.onlyEnabled) q = q.eq("enabled", true);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return (data as CustomCommandRow | null) ?? null;
}

export async function upsertCustomCommand(input: {
  guildId: string;
  name: string;
  responseText: string;
  embed: Record<string, unknown> | null;
  createdBy: string;
}) {
  const { error } = await supabase
    .from("custom_commands")
    .upsert(
      {
        guild_id: input.guildId,
        name: input.name,
        response_text: input.responseText,
        embed: input.embed,
        created_by: input.createdBy,
        enabled: true,
      },
      { onConflict: "guild_id,name" },
    );
  if (error) throw error;
}

export async function deleteCustomCommand(guildId: string, name: string) {
  const { error } = await supabase
    .from("custom_commands")
    .delete()
    .eq("guild_id", guildId)
    .eq("name", name);
  if (error) throw error;
}

export async function listCustomCommands(guildId: string, limit = 50): Promise<CustomCommandRow[]> {
  const { data, error } = await supabase
    .from("custom_commands")
    .select("*")
    .eq("guild_id", guildId)
    .order("name")
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as CustomCommandRow[];
}

export async function incrementCustomCommandUses(id: string) {
  // Best-effort: read + update. Não atômico, mas suficiente para contador de uso.
  const { data } = await supabase.from("custom_commands").select("uses").eq("id", id).maybeSingle();
  const uses = ((data as any)?.uses ?? 0) + 1;
  await supabase.from("custom_commands").update({ uses }).eq("id", id);
}

// ============================================================
// Reminders
// ============================================================

export interface ReminderRow {
  id: string;
  user_id: string;
  guild_id: string | null;
  channel_id: string | null;
  message: string;
  fire_at: string;
  fired: boolean;
}

export async function countActiveReminders(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("reminders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("fired", false);
  if (error) throw error;
  return count ?? 0;
}

export async function createReminder(input: {
  guildId: string;
  userId: string;
  channelId: string;
  message: string;
  fireAt: Date;
}): Promise<ReminderRow> {
  const { data, error } = await supabase
    .from("reminders")
    .insert({
      guild_id: input.guildId,
      user_id: input.userId,
      channel_id: input.channelId,
      message: input.message,
      fire_at: input.fireAt.toISOString(),
      fired: false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ReminderRow;
}

export async function listActiveReminders(guildId: string, userId: string, limit = 10): Promise<ReminderRow[]> {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", userId)
    .eq("guild_id", guildId)
    .eq("fired", false)
    .order("fire_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ReminderRow[];
}

export async function deleteReminder(id: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .eq("fired", false)
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function findDueReminders(now: Date, limit = 50): Promise<ReminderRow[]> {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("fired", false)
    .lte("fire_at", now.toISOString())
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ReminderRow[];
}

export async function markReminderFired(id: string) {
  const { error } = await supabase
    .from("reminders")
    .update({ fired: true, fired_at: new Date().toISOString() })
    .eq("id", id);
  if (error) logger.warn({ err: error, id }, "markReminderFired falhou");
}

// ============================================================
// Announcements
// ============================================================

export interface AnnouncementRow {
  id: string;
  guild_id: string;
  channel_id: string;
  author_id: string;
  content: string | null;
  embed: Record<string, unknown> | null;
  scheduled_at: string | null;
  sent_at: string | null;
  message_id: string | null;
  sent: boolean;
}

export async function createAnnouncement(input: {
  guildId: string;
  channelId: string;
  authorId: string;
  content: string;
  title?: string | null;
  mention?: string | null;
  scheduledAt?: Date | null;
  sentAt?: Date | null;
}): Promise<AnnouncementRow> {
  const embed = {
    title: input.title ?? null,
    mention: input.mention ?? null,
  };
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      guild_id: input.guildId,
      channel_id: input.channelId,
      author_id: input.authorId,
      content: input.content,
      embed,
      scheduled_at: input.scheduledAt ? input.scheduledAt.toISOString() : null,
      sent_at: input.sentAt ? input.sentAt.toISOString() : null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as AnnouncementRow;
}

export async function listScheduledAnnouncements(guildId: string, limit = 10): Promise<AnnouncementRow[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("guild_id", guildId)
    .is("sent_at", null)
    .order("scheduled_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AnnouncementRow[];
}

export async function findDueAnnouncements(now: Date, limit = 20): Promise<AnnouncementRow[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .is("sent_at", null)
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", now.toISOString())
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AnnouncementRow[];
}

export async function markAnnouncementSent(id: string, messageId?: string | null) {
  const patch: Record<string, unknown> = { sent_at: new Date().toISOString() };
  if (messageId) patch.message_id = messageId;
  const { error } = await supabase.from("announcements").update(patch).eq("id", id);
  if (error) logger.warn({ err: error, id }, "markAnnouncementSent falhou");
}

// ============================================================
// AutoMod incidents
// ============================================================

export async function createAutomodIncident(input: {
  guildId: string;
  userId: string;
  channelId?: string | null;
  type: string;
  severity?: "low" | "medium" | "high" | "critical";
  reason?: string | null;
  messageId?: string | null;
  detail?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("automod_incidents").insert({
    guild_id: input.guildId,
    user_id: input.userId,
    channel_id: input.channelId ?? null,
    type: input.type,
    severity: input.severity ?? "low",
    reason: input.reason ?? null,
    message_id: input.messageId ?? null,
    detail: input.detail ?? {},
  });
  if (error) logger.warn({ err: error, type: input.type }, "createAutomodIncident falhou");
}

// ============================================================
// Daily tokens (HTTP bridge — fluxo /daily)
// ============================================================

export interface DailyTokenRow {
  id: string;
  user_id: string;
  guild_id: string | null;
  token: string;
  used: boolean;
  expires_at: string;
}

export async function createDailyToken(input: {
  guildId: string;
  userId: string;
  token: string;
  expiresAt: Date;
}) {
  const { error } = await supabase.from("daily_tokens").insert({
    guild_id: input.guildId,
    user_id: input.userId,
    token: input.token,
    used: false,
    expires_at: input.expiresAt.toISOString(),
  });
  if (error) throw error;
}

export async function findDailyToken(token: string): Promise<DailyTokenRow | null> {
  const { data, error } = await supabase
    .from("daily_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  return (data as DailyTokenRow | null) ?? null;
}

/**
 * Consome o token atomicamente: marca used=true apenas se ainda não foi usado.
 * Retorna o registro consumido, ou null se já estava usado / não existe.
 */
export async function consumeDailyToken(token: string): Promise<DailyTokenRow | null> {
  const { data, error } = await supabase
    .from("daily_tokens")
    .update({ used: true, used_at: new Date().toISOString() })
    .eq("token", token)
    .eq("used", false)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return (data as DailyTokenRow | null) ?? null;
}
