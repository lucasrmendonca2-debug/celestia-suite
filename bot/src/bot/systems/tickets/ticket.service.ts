import { supabase } from "../../../database/supabase.js";
import { logger } from "../../utils/logger.js";

export type TicketStatus = "open" | "closed" | "deleted";

export interface TicketConfig {
  guild_id: string;
  enabled: boolean;
  panel_channel_id: string | null;
  panel_message_id: string | null;
  category_id: string | null;
  default_support_role_id: string | null;
  log_channel_id: string | null;
  max_open_tickets_per_user: number;
  panel_title: string;
  panel_description: string;
  panel_button_label: string;
  panel_button_emoji: string;
  panel_color: number;
  ticket_welcome_message: string;
  close_message: string;
  transcript_enabled: boolean;
  rating_enabled: boolean;
  allow_user_close_ticket: boolean;
  use_single_panel: boolean;
}

export interface TicketRow {
  id: string;
  guild_id: string;
  channel_id: string;
  user_id: string;
  username: string;
  category_id: string | null;
  category_name: string | null;
  status: TicketStatus;
  priority: boolean;
  claimed_by: string | null;
  closed_by: string | null;
  close_reason: string | null;
  rating: number | null;
  created_at: string;
  closed_at: string | null;
}

const DEFAULT_CONFIG: Omit<TicketConfig, "guild_id"> = {
  enabled: false,
  panel_channel_id: null,
  panel_message_id: null,
  category_id: null,
  default_support_role_id: null,
  log_channel_id: null,
  max_open_tickets_per_user: 5,
  panel_title: "🎫 Central de Atendimento",
  panel_description:
    "Precisa de ajuda? Selecione no menu abaixo o tipo de atendimento e nossa equipe te responde aqui em instantes.",
  panel_button_label: "Abrir ticket",
  panel_button_emoji: "🎫",
  panel_color: 0x7c3aed,
  ticket_welcome_message:
    "Olá {user}! 👋 Obrigado por abrir um ticket.\n\nDescreva com calma o que aconteceu, mande prints se ajudar, e a equipe {staff} responde em instantes. ⏳",
  close_message:
    "Este ticket foi fechado por {staff}. Avalie nosso atendimento ou peça reabertura caso ainda precise de ajuda. 💜",
  transcript_enabled: true,
  rating_enabled: false,
  allow_user_close_ticket: true,
  use_single_panel: true,
};

export async function getTicketConfig(guildId: string): Promise<TicketConfig> {
  const { data, error } = await supabase
    .from("ticket_configs")
    .select("*")
    .eq("guild_id", guildId)
    .maybeSingle();
  if (error) {
    logger.error({ err: error, guildId }, "getTicketConfig falhou");
  }
  if (data) return data as TicketConfig;
  return { guild_id: guildId, ...DEFAULT_CONFIG };
}

export async function upsertTicketConfig(
  cfg: Partial<TicketConfig> & { guild_id: string },
): Promise<TicketConfig> {
  const { data, error } = await supabase
    .from("ticket_configs")
    .upsert(cfg, { onConflict: "guild_id" })
    .select()
    .single();
  if (error) throw error;
  return data as TicketConfig;
}

export async function countOpenTickets(guildId: string, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .eq("status", "open");
  if (error) {
    logger.error({ err: error }, "countOpenTickets falhou");
    return 0;
  }
  return count ?? 0;
}

export async function createTicketRow(input: {
  guild_id: string;
  channel_id: string;
  user_id: string;
  username: string;
  category_id?: string | null;
  category_name?: string | null;
  priority?: boolean;
}): Promise<TicketRow> {
  const { data, error } = await supabase
    .from("tickets")
    .insert({
      guild_id: input.guild_id,
      channel_id: input.channel_id,
      user_id: input.user_id,
      username: input.username,
      category_id: input.category_id ?? null,
      category_name: input.category_name ?? null,
      priority: input.priority ?? false,
      status: "open" as TicketStatus,
    })
    .select()
    .single();
  if (error) throw error;
  return data as TicketRow;
}

export async function findTicketByChannel(channelId: string): Promise<TicketRow | null> {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("channel_id", channelId)
    .maybeSingle();
  if (error) {
    logger.error({ err: error }, "findTicketByChannel falhou");
    return null;
  }
  return (data as TicketRow | null) ?? null;
}

export async function closeTicketRow(
  ticketId: string,
  closedBy: string,
  reason?: string,
): Promise<void> {
  const { error } = await supabase
    .from("tickets")
    .update({
      status: "closed",
      closed_by: closedBy,
      close_reason: reason ?? null,
      closed_at: new Date().toISOString(),
    })
    .eq("id", ticketId);
  if (error) throw error;
}

export async function setPanelMessage(
  guildId: string,
  channelId: string,
  messageId: string,
): Promise<void> {
  await supabase
    .from("ticket_configs")
    .update({ panel_channel_id: channelId, panel_message_id: messageId })
    .eq("guild_id", guildId);
}

export async function writeLog(
  guildId: string,
  ticketId: string | null,
  action: string,
  userId: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  await supabase.from("ticket_logs").insert({
    guild_id: guildId,
    ticket_id: ticketId,
    action,
    user_id: userId,
    details,
  });
}

/* =============== Fase 2: categorias, permissões, níveis =============== */

export interface TicketCategory {
  id: string;
  guild_id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  support_role_id: string | null;
  discord_category_id: string | null;
  active: boolean;
  priority: boolean;
  required_role_ids: string[];
  blocked_role_ids: string[];
  allowed_access_levels: string[];
  max_open_tickets_per_user: number | null;
  welcome_message: string | null;
  position: number;
}

export interface TicketAccessLevel {
  id: string;
  guild_id: string;
  key: string;
  name: string;
  rank: number;
  role_ids: string[];
}

export interface TicketPermissionRole {
  id: string;
  guild_id: string;
  role_id: string;
  access_level: string;
  can_open_ticket: boolean;
  can_open_priority_ticket: boolean;
  can_close_ticket: boolean;
  can_claim_ticket: boolean;
}

export async function listActiveCategories(guildId: string): Promise<TicketCategory[]> {
  const { data, error } = await supabase
    .from("ticket_categories")
    .select("*")
    .eq("guild_id", guildId)
    .eq("active", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    logger.error({ err: error, guildId }, "listActiveCategories falhou");
    return [];
  }
  return (data ?? []) as TicketCategory[];
}

export async function getCategoryById(
  guildId: string,
  id: string,
): Promise<TicketCategory | null> {
  const { data, error } = await supabase
    .from("ticket_categories")
    .select("*")
    .eq("guild_id", guildId)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    logger.error({ err: error }, "getCategoryById falhou");
    return null;
  }
  return (data as TicketCategory | null) ?? null;
}

export async function listAccessLevels(guildId: string): Promise<TicketAccessLevel[]> {
  const { data, error } = await supabase
    .from("ticket_access_levels")
    .select("*")
    .eq("guild_id", guildId)
    .order("rank", { ascending: false });
  if (error) {
    logger.error({ err: error }, "listAccessLevels falhou");
    return [];
  }
  return (data ?? []) as TicketAccessLevel[];
}

export async function listPermissionRoles(guildId: string): Promise<TicketPermissionRole[]> {
  const { data, error } = await supabase
    .from("ticket_permission_roles")
    .select("*")
    .eq("guild_id", guildId);
  if (error) {
    logger.error({ err: error }, "listPermissionRoles falhou");
    return [];
  }
  return (data ?? []) as TicketPermissionRole[];
}
