import { Guild } from "discord.js";
import {
  findActiveUserVip,
  deactivateUserVips,
  type VipTier,
} from "../../repositories/phase4.repo.js";
import { supabase } from "../../../database/supabase.js";
import { getConfig } from "../../utils/guildCache.js";
import { sendLog } from "../logs/sender.js";
import { brandEmbed } from "../../utils/embed.js";
import { logger } from "../../utils/logger.js";

/**
 * Legacy guild-scoped VIP. Mantido para compatibilidade com `/vip` antigo.
 * O caminho moderno é `premium.service.ts` (USER_VIP via plano).
 *
 * grantVip aqui escreve direto em premium_subscriptions com type=USER_VIP e
 * plan_id do primeiro plano USER_VIP ativo encontrado (fallback para qualquer
 * plano se não houver).
 */
export async function grantVip(args: {
  guild: Guild;
  userId: string;
  tier: VipTier;
  grantedById: string;
  durationMs?: number | null;
}) {
  const expiresAt = args.durationMs ? new Date(Date.now() + args.durationMs) : null;

  const { data: plan } = await supabase
    .from("premium_plans")
    .select("id")
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!plan) {
    logger.warn({ guildId: args.guild.id, userId: args.userId }, "grantVip: nenhum plano ativo");
    return null;
  }

  await deactivateUserVips(args.guild.id, args.userId);
  const { data: membership, error } = await supabase
    .from("premium_subscriptions")
    .insert({
      type: "USER_VIP",
      plan_id: plan.id,
      guild_id: args.guild.id,
      user_id: args.userId,
      status: "ACTIVE",
      starts_at: new Date().toISOString(),
      expires_at: expiresAt?.toISOString() ?? null,
      created_by: args.grantedById,
      source: "manual",
      notes: args.tier,
    })
    .select()
    .maybeSingle();
  if (error) {
    logger.warn({ err: error }, "grantVip insert failed");
    return null;
  }

  const cfg = await getConfig(args.guild.id);
  if (cfg.vipRoleId) {
    const member = await args.guild.members.fetch(args.userId).catch(() => null);
    const role = args.guild.roles.cache.get(cfg.vipRoleId);
    if (member && role && args.guild.members.me?.permissions.has("ManageRoles")) {
      await member.roles.add(role).catch(() => {});
    }
  }

  await sendLog(
    args.guild,
    "modLogChannelId",
    brandEmbed({
      kind: "success",
      title: "💎 VIP concedido",
      fields: [
        { name: "Usuário", value: `<@${args.userId}>`, inline: true },
        { name: "Tier", value: args.tier, inline: true },
        { name: "Expira", value: expiresAt ? `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : "Vitalício", inline: true },
      ],
    }),
    "vip.grant",
    { userId: args.userId, tier: args.tier, expiresAt },
  );

  return membership;
}

export async function revokeVip(guild: Guild, userId: string, byId: string) {
  await deactivateUserVips(guild.id, userId);
  const cfg = await getConfig(guild.id);
  if (cfg.vipRoleId) {
    const member = await guild.members.fetch(userId).catch(() => null);
    const role = guild.roles.cache.get(cfg.vipRoleId);
    if (member && role) await member.roles.remove(role).catch(() => {});
  }
  await sendLog(
    guild,
    "modLogChannelId",
    brandEmbed({
      kind: "warn",
      title: "💎 VIP removido",
      fields: [
        { name: "Usuário", value: `<@${userId}>`, inline: true },
        { name: "Por", value: `<@${byId}>`, inline: true },
      ],
    }),
    "vip.revoke",
    { userId, byId },
  );
}

export async function isVip(guildId: string, userId: string): Promise<boolean> {
  const m = await findActiveUserVip(guildId, userId);
  if (!m) return false;
  if (m.expires_at && new Date(m.expires_at) < new Date()) return false;
  return true;
}
