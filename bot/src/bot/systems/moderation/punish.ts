import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import ms from "ms";
import { prisma } from "../../../database/client.js";
import { brandEmbed } from "../../utils/embed.js";
import { sendLog } from "../logs/sender.js";
import type { PunishmentType } from "@prisma/client";

interface BaseArgs {
  guildId: string;
  moderatorId: string;
  reason?: string;
}

export async function recordPunishment(
  args: BaseArgs & { userId: string; type: PunishmentType; durationMs?: number },
) {
  return prisma.punishment.create({
    data: {
      guildId: args.guildId,
      userId: args.userId,
      moderatorId: args.moderatorId,
      type: args.type,
      reason: args.reason ?? null,
      durationMs: args.durationMs ?? null,
      expiresAt: args.durationMs ? new Date(Date.now() + args.durationMs) : null,
    },
  });
}

export async function logModeration(
  member: GuildMember | { guild: GuildMember["guild"]; id: string; user: { tag: string } },
  type: PunishmentType,
  moderatorId: string,
  reason?: string,
  duration?: string,
) {
  const fields = [
    { name: "Usuário", value: `<@${member.id}>`, inline: true },
    { name: "Moderador", value: `<@${moderatorId}>`, inline: true },
  ];
  if (duration) fields.push({ name: "Duração", value: duration, inline: true });
  fields.push({ name: "Motivo", value: reason ?? "Sem motivo informado" });

  await sendLog(
    member.guild,
    "modLogChannelId",
    brandEmbed({
      kind: type === "WARN" ? "warn" : "error",
      title: `🛡️ ${type}`,
      fields,
    }),
    "moderation",
    { type, userId: member.id, moderatorId, reason, duration },
  );
}

export function parseDuration(input: string | null | undefined): number | null {
  if (!input) return null;
  const v = ms(input);
  return typeof v === "number" && v > 0 ? v : null;
}

export { ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits, TextChannel };
