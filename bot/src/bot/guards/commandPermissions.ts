/**
 * Permissões por comando — lê `public.command_permissions` no Supabase
 * (mesma tabela editada pelo dashboard) e aplica antes de executar
 * qualquer slash command.
 */
import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { supabase } from "../../database/supabase.js";
import { logger } from "../utils/logger.js";

export interface CommandPermission {
  guild_id: string;
  command_name: string;
  enabled: boolean;
  allowed_roles: string[];
  denied_roles: string[];
  allowed_channels: string[];
  denied_channels: string[];
  cooldown_override: number | null;
  staff_only: boolean;
  vip_only: boolean;
  premium_guild_only: boolean;
  hidden_from_help: boolean;
}

export type PermissionCheck =
  | { ok: true; cooldownOverride: number | null }
  | { ok: false; reason: string };

const CACHE_TTL_MS = 30_000;
type CacheKey = string; // `${guildId}:${commandName}`
const cache = new Map<CacheKey, { value: CommandPermission | null; at: number }>();

export function invalidateCommandPermission(guildId: string, commandName?: string) {
  if (commandName) cache.delete(`${guildId}:${commandName}`);
  else for (const k of cache.keys()) if (k.startsWith(`${guildId}:`)) cache.delete(k);
}

export async function getCommandPermission(
  guildId: string,
  commandName: string,
): Promise<CommandPermission | null> {
  const key = `${guildId}:${commandName}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const { data, error } = await supabase
    .from("command_permissions")
    .select("*")
    .eq("guild_id", guildId)
    .eq("command_name", commandName)
    .maybeSingle();

  if (error) {
    logger.warn({ err: error, guildId, commandName }, "getCommandPermission falhou");
    return null;
  }
  const value = (data as CommandPermission | null) ?? null;
  cache.set(key, { value, at: Date.now() });
  return value;
}

export async function listCommandPermissions(guildId: string): Promise<CommandPermission[]> {
  const { data, error } = await supabase
    .from("command_permissions")
    .select("*")
    .eq("guild_id", guildId);
  if (error) {
    logger.warn({ err: error, guildId }, "listCommandPermissions falhou");
    return [];
  }
  return (data ?? []) as CommandPermission[];
}

interface CheckArgs {
  member: GuildMember | null;
  channelId: string | null;
  isStaff: boolean;
  isVip: boolean;
  isPremiumGuild: boolean;
}

export async function checkCommandPermission(
  interaction: ChatInputCommandInteraction,
  args: CheckArgs,
): Promise<PermissionCheck> {
  if (!interaction.guildId) return { ok: true, cooldownOverride: null };

  const perm = await getCommandPermission(interaction.guildId, interaction.commandName);
  if (!perm) return { ok: true, cooldownOverride: null };

  if (!perm.enabled) return { ok: false, reason: "Esse comando está desativado neste servidor." };

  const channelId = args.channelId ?? interaction.channelId;
  if (channelId) {
    if (perm.denied_channels.includes(channelId))
      return { ok: false, reason: "Esse comando está bloqueado neste canal." };
    if (perm.allowed_channels.length > 0 && !perm.allowed_channels.includes(channelId))
      return { ok: false, reason: "Esse comando não pode ser usado neste canal." };
  }

  const member = args.member;
  if (member) {
    const roleIds = [...member.roles.cache.keys()];
    if (perm.denied_roles.some((r) => roleIds.includes(r)))
      return { ok: false, reason: "Seu cargo está bloqueado pra usar esse comando." };
    if (perm.allowed_roles.length > 0 && !perm.allowed_roles.some((r) => roleIds.includes(r)))
      return { ok: false, reason: "Você não tem cargo permitido pra usar esse comando." };
  }

  if (perm.staff_only && !args.isStaff)
    return { ok: false, reason: "Esse comando é restrito à staff." };
  if (perm.vip_only && !args.isVip)
    return { ok: false, reason: "Esse comando é exclusivo para usuários VIP." };
  if (perm.premium_guild_only && !args.isPremiumGuild)
    return { ok: false, reason: "Esse comando exige servidor com plano premium ativo." };

  return { ok: true, cooldownOverride: perm.cooldown_override };
}
