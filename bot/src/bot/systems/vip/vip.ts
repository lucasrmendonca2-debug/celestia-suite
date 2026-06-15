import { Guild, GuildMember } from "discord.js";
import type { VipTier } from "@prisma/client";
import { prisma } from "../../../database/client.js";
import { getConfig } from "../../utils/guildCache.js";
import { sendLog } from "../logs/sender.js";
import { brandEmbed } from "../../utils/embed.js";

export async function grantVip(args: {
  guild: Guild;
  userId: string;
  tier: VipTier;
  grantedById: string;
  durationMs?: number | null;
}) {
  const expiresAt = args.durationMs ? new Date(Date.now() + args.durationMs) : null;
  const membership = await prisma.vipMembership.upsert({
    where: { guildId_userId: { guildId: args.guild.id, userId: args.userId } },
    create: {
      guildId: args.guild.id,
      userId: args.userId,
      tier: args.tier,
      grantedById: args.grantedById,
      expiresAt,
      active: true,
    },
    update: {
      tier: args.tier,
      grantedById: args.grantedById,
      expiresAt,
      active: true,
    },
  });

  // Cargo VIP, se configurado
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
  await prisma.vipMembership.updateMany({
    where: { guildId: guild.id, userId },
    data: { active: false },
  });
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
  const m = await prisma.vipMembership.findUnique({
    where: { guildId_userId: { guildId, userId } },
  });
  if (!m || !m.active) return false;
  if (m.expiresAt && m.expiresAt < new Date()) return false;
  return true;
}
