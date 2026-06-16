import type { Guild } from "discord.js";
import { supabase } from "../../../database/supabase.js";
import { logger } from "../../utils/logger.js";

async function getGuildPremiumConfig(guildId: string) {
  const { data } = await supabase
    .from("premium_guild_config")
    .select("*")
    .eq("guild_id", guildId)
    .maybeSingle();
  return data as { vip_role_id: string | null; premium_role_id: string | null } | null;
}

function canManageRole(guild: Guild, roleId: string): boolean {
  const role = guild.roles.cache.get(roleId);
  const me = guild.members.me;
  if (!role || !me) return false;
  if (!me.permissions.has("ManageRoles")) return false;
  return me.roles.highest.comparePositionTo(role) > 0;
}

export async function applyVipRole(guild: Guild, userId: string) {
  const cfg = await getGuildPremiumConfig(guild.id);
  if (!cfg?.vip_role_id) return;
  if (!canManageRole(guild, cfg.vip_role_id)) return;
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return;
  await member.roles.add(cfg.vip_role_id).catch((err) => logger.warn({ err }, "applyVipRole falhou"));
}

export async function removeVipRole(guild: Guild, userId: string) {
  const cfg = await getGuildPremiumConfig(guild.id);
  if (!cfg?.vip_role_id) return;
  if (!canManageRole(guild, cfg.vip_role_id)) return;
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return;
  await member.roles.remove(cfg.vip_role_id).catch((err) => logger.warn({ err }, "removeVipRole falhou"));
}
