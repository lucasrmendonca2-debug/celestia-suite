import type { GuildMember } from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import { supabase } from "../../../database/supabase.js";

export type TicketPermissionKey =
  | "can_open_ticket"
  | "can_open_priority_ticket"
  | "can_close_ticket"
  | "can_claim_ticket";

/**
 * Retorna true se ao menos um dos cargos do membro tem a permissão `key`
 * marcada como true em ticket_permission_roles.
 */
export async function memberHasTicketPermission(
  member: GuildMember,
  key: TicketPermissionKey,
): Promise<boolean> {
  const roleIds = [...member.roles.cache.keys()];
  if (roleIds.length === 0) return false;
  const { data } = await supabase
    .from("ticket_permission_roles")
    .select(key)
    .eq("guild_id", member.guild.id)
    .in("role_id", roleIds)
    .eq(key, true)
    .limit(1);
  return !!(data && data.length > 0);
}

/**
 * Pode fechar: dono (se allowUserClose) | ManageChannels | can_close_ticket.
 */
export async function canMemberClose(
  member: GuildMember,
  ticketOwnerId: string,
  allowUserClose: boolean,
): Promise<boolean> {
  if (member.id === ticketOwnerId && allowUserClose) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageChannels)) return true;
  return memberHasTicketPermission(member, "can_close_ticket");
}

/** Pode assumir (claim). */
export async function canMemberClaim(member: GuildMember): Promise<boolean> {
  if (member.permissions.has(PermissionFlagsBits.ManageChannels)) return true;
  return memberHasTicketPermission(member, "can_claim_ticket");
}

/** Pode reabrir (mesma lógica de close por enquanto). */
export async function canMemberReopen(member: GuildMember): Promise<boolean> {
  if (member.permissions.has(PermissionFlagsBits.ManageChannels)) return true;
  return memberHasTicketPermission(member, "can_close_ticket");
}

export function memberIsAdmin(member: GuildMember): boolean {
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild)
  );
}

import type {
  TicketAccessLevel,
  TicketCategory,
  TicketPermissionRole,
} from "./ticket.service.js";

/**
 * Decide o melhor nível de acesso de um membro, dado os níveis cadastrados
 * (rank alto vence) e as permissões por cargo. "member" é o fallback.
 */
export function resolveAccessLevel(
  member: GuildMember,
  levels: TicketAccessLevel[],
  perms: TicketPermissionRole[],
): string {
  const memberRoles = new Set(member.roles.cache.keys());
  let bestKey = "member";
  let bestRank = -Infinity;

  // 1) níveis explícitos (role_ids)
  for (const lvl of levels) {
    if (lvl.role_ids.some((r) => memberRoles.has(r)) && lvl.rank > bestRank) {
      bestRank = lvl.rank;
      bestKey = lvl.key;
    }
  }
  // 2) permissions_roles → access_level
  const levelByKey = new Map(levels.map((l) => [l.key, l]));
  for (const p of perms) {
    if (!memberRoles.has(p.role_id)) continue;
    const lvl = levelByKey.get(p.access_level);
    const rank = lvl?.rank ?? 0;
    if (rank > bestRank) {
      bestRank = rank;
      bestKey = p.access_level;
    }
  }
  return bestKey;
}

/**
 * Verifica se o membro pode abrir um ticket nessa categoria.
 * Retorna mensagem de erro (string) se negado, ou null se ok.
 */
export function canOpenCategory(
  member: GuildMember,
  category: TicketCategory,
  accessLevelKey: string,
): string | null {
  const memberRoles = new Set(member.roles.cache.keys());

  if (category.blocked_role_ids.some((r) => memberRoles.has(r))) {
    return "Você não tem permissão para abrir tickets nesta categoria.";
  }
  if (
    category.required_role_ids.length > 0 &&
    !category.required_role_ids.some((r) => memberRoles.has(r))
  ) {
    return "Você precisa de um cargo específico para abrir tickets nesta categoria.";
  }
  if (
    category.allowed_access_levels.length > 0 &&
    !category.allowed_access_levels.includes(accessLevelKey)
  ) {
    return "Seu nível de acesso não permite abrir tickets nesta categoria.";
  }
  return null;
}
