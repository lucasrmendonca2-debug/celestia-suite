import type { GuildMember, Message } from "discord.js";
import { LevelAccount, LevelReward } from "../../../database/models.js";
import { getConfig } from "../../utils/guildCache.js";
import { applyVars } from "../../utils/format.js";
import { brandEmbed } from "../../utils/embed.js";
import { isVip } from "../economy/economy.js";

/** XP necessário para passar do nível N para o N+1. Curva suave estilo mee6. */
export function xpForLevel(level: number) {
  return 5 * level * level + 50 * level + 100;
}

export function totalXpForLevel(level: number) {
  let total = 0;
  for (let i = 0; i < level; i++) total += xpForLevel(i);
  return total;
}

const XP_COOLDOWN_MS = 60_000;

export async function handleMessageXp(msg: Message) {
  if (!msg.inGuild() || msg.author.bot) return;
  const cfg = await getConfig(msg.guildId);
  if (!cfg.levelEnabled) return;
  if (cfg.noXpChannels?.includes(msg.channelId)) return;
  const member = msg.member;
  if (member && cfg.noXpRoles?.some((r) => member.roles.cache.has(r))) return;

  const acc = await LevelAccount.findOne({ guildId: msg.guildId, userId: msg.author.id });
  const now = new Date();
  if (acc?.lastXpAt && now.getTime() - acc.lastXpAt.getTime() < XP_COOLDOWN_MS) return;

  const vipBoost = (await isVip(msg.guildId, msg.author.id)) ? 1.5 : 1;
  const gained = Math.floor((15 + Math.random() * 10) * (cfg.levelMultiplier ?? 1) * vipBoost);

  const current = acc ?? (await LevelAccount.create({ guildId: msg.guildId, userId: msg.author.id }));
  current.xp += gained;
  current.totalXp += gained;
  current.lastXpAt = now;

  let leveledUp = false;
  while (current.xp >= xpForLevel(current.level)) {
    current.xp -= xpForLevel(current.level);
    current.level += 1;
    leveledUp = true;
  }
  await current.save();

  if (leveledUp) await onLevelUp(msg, current.level, cfg.levelMessage, cfg.levelUpChannelId);
}

async function onLevelUp(msg: Message, level: number, template: string, channelId?: string | null) {
  if (!msg.inGuild()) return;
  const channel = channelId ? msg.guild.channels.cache.get(channelId) : msg.channel;
  if (!channel?.isTextBased() || !("send" in channel)) return;

  const text = applyVars(template, { user: `<@${msg.author.id}>`, level, server: msg.guild.name });
  await channel.send({
    embeds: [brandEmbed({ kind: "success", title: "📈 Subiu de nível!", description: text })],
  }).catch(() => {});

  // Aplica recompensa
  const reward = await LevelReward.findOne({ guildId: msg.guildId, level });
  if (reward && msg.member) {
    await applyReward(msg.member, reward.roleId, reward.removePrevious);
  }
}

async function applyReward(member: GuildMember, roleId: string, removePrevious: boolean) {
  try {
    if (removePrevious) {
      const prev = await LevelReward.find({ guildId: member.guild.id });
      for (const r of prev) {
        if (r.roleId !== roleId && member.roles.cache.has(r.roleId)) {
          await member.roles.remove(r.roleId).catch(() => {});
        }
      }
    }
    await member.roles.add(roleId);
  } catch {
    /* sem perm */
  }
}
