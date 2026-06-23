import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import ms from "ms";
import { createPunishment, type PunishmentType } from "../../repositories/phase4.repo.js";
import { brandEmbed } from "../../utils/embed.js";
import { sendLog } from "../logs/sender.js";

interface BaseArgs {
  guildId: string;
  moderatorId: string;
  reason?: string;
}

export async function recordPunishment(
  args: BaseArgs & { userId: string; type: PunishmentType; durationMs?: number },
) {
  return createPunishment({
    guildId: args.guildId,
    userId: args.userId,
    moderatorId: args.moderatorId,
    type: args.type,
    reason: args.reason ?? null,
    durationMs: args.durationMs ?? null,
  });
}

export type { PunishmentType };

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
  fields.push({ name: "Motivo", value: reason ?? "Sem motivo informado", inline: false });

  await sendLog(
    member.guild,
    "modLogChannelId",
    brandEmbed({ kind: type === "WARN" ? "warn" : "error", title: `🛡️ ${type}`, fields }),
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
