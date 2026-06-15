import type { GuildMember } from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import { supabase } from "../../../database/supabase.js";

/**
 * Verifica se um membro tem permissão pra fechar tickets:
 * - É o dono do ticket (sempre, se config.allow_user_close_ticket)
 * - Tem cargo configurado com can_close_ticket = true
 * - Tem ManageChannels
 */
export async function canMemberClose(
  member: GuildMember,
  ticketOwnerId: string,
  allowUserClose: boolean,
): Promise<boolean> {
  if (member.id === ticketOwnerId && allowUserClose) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageChannels)) return true;

  const roleIds = [...member.roles.cache.keys()];
  if (roleIds.length === 0) return false;

  const { data } = await supabase
    .from("ticket_permission_roles")
    .select("can_close_ticket")
    .eq("guild_id", member.guild.id)
    .in("role_id", roleIds)
    .eq("can_close_ticket", true)
    .limit(1);

  return !!(data && data.length > 0);
}

export function memberIsAdmin(member: GuildMember): boolean {
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild)
  );
}
