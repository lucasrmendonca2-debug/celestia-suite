import { GuildMember, PermissionFlagsBits } from "discord.js";
import {
  type ModerationConfig,
  type ModerationPermissionRole,
  listPermissionRoles,
  getModerationConfig,
} from "./moderation.service.js";

export type ModCapability = keyof Omit<ModerationPermissionRole, "role_id">;

const OWNER_ID = process.env.OWNER_ID ?? "";

/**
 * Verifica se o membro tem a capability solicitada baseado em:
 *  - OWNER_ID global
 *  - Dono do servidor
 *  - Administrador nativo do Discord
 *  - Cargos configurados no dashboard
 */
export async function hasModCapability(
  member: GuildMember,
  capability: ModCapability,
): Promise<boolean> {
  if (!member?.guild) return false;
  if (member.id === OWNER_ID) return true;
  if (member.id === member.guild.ownerId) return true;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

  const roles = await listPermissionRoles(member.guild.id);
  if (!roles.length) return false;

  const memberRoleIds = new Set(member.roles.cache.map((r) => r.id));
  return roles.some(
    (r) => memberRoleIds.has(r.role_id) && r.can_use_moderation && r[capability] === true,
  );
}

export interface PunishCheckResult {
  ok: boolean;
  reason?: string;
}

/**
 * Valida se o staff pode punir o alvo:
 *  - alvo não é dono nem OWNER_ID
 *  - alvo não está em protected_user_ids
 *  - alvo não tem nenhum protected_role_ids
 *  - cargo do staff > cargo do alvo (exceto se staff é dono)
 *  - cargo do bot > cargo do alvo
 */
export async function canPunishTarget(
  staff: GuildMember,
  target: GuildMember,
  config?: ModerationConfig,
): Promise<PunishCheckResult> {
  const cfg = config ?? (await getModerationConfig(staff.guild.id));

  if (target.id === OWNER_ID) {
    return { ok: false, reason: "Esse usuário é o dono global do bot e não pode ser punido." };
  }
  if (target.id === staff.guild.ownerId) {
    return { ok: false, reason: "Não posso punir o dono do servidor." };
  }
  if (target.user.bot && target.id === staff.guild.members.me?.id) {
    return { ok: false, reason: "Não posso punir a mim mesmo." };
  }
  if (cfg.protected_user_ids?.includes(target.id)) {
    return { ok: false, reason: "Esse usuário está protegido pelas configurações do servidor." };
  }
  if (
    cfg.protected_role_ids?.length &&
    target.roles.cache.some((r) => cfg.protected_role_ids.includes(r.id))
  ) {
    return { ok: false, reason: "Esse usuário possui um cargo protegido." };
  }

  const isStaffOwner = staff.id === staff.guild.ownerId || staff.id === OWNER_ID;
  if (!isStaffOwner) {
    const staffTop = staff.roles.highest.position;
    const targetTop = target.roles.highest.position;
    if (targetTop >= staffTop) {
      return {
        ok: false,
        reason:
          "Não consigo punir esse usuário porque ele possui um cargo igual ou superior ao seu.",
      };
    }
  }

  const me = staff.guild.members.me;
  if (me) {
    if (target.roles.highest.position >= me.roles.highest.position) {
      return {
        ok: false,
        reason:
          "Não consigo punir esse usuário porque ele possui um cargo igual ou superior ao meu.",
      };
    }
  }

  return { ok: true };
}
