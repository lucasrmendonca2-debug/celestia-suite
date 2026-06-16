import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  Guild,
  User,
  type ColorResolvable,
} from "discord.js";
import { getModerationConfig, type ModerationConfig, type PunishmentType } from "./moderation.service.js";

const ACTION_LABELS: Record<PunishmentType, string> = {
  BAN: "Banimento",
  TEMP_BAN: "Banimento temporário",
  UNBAN: "Desbanimento",
  KICK: "Expulsão",
  MUTE: "Mute",
  TEMP_MUTE: "Mute temporário",
  UNMUTE: "Remoção de mute",
  WARN: "Advertência",
  CLEAR: "Limpeza de mensagens",
  LOCK: "Canal trancado",
  UNLOCK: "Canal destrancado",
  SLOWMODE: "Slowmode",
};

export function actionLabel(type: PunishmentType) {
  return ACTION_LABELS[type] ?? type;
}

export function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "Permanente";
  const units: [number, string][] = [
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
    [1, "s"],
  ];
  let remaining = seconds;
  const parts: string[] = [];
  for (const [s, label] of units) {
    const v = Math.floor(remaining / s);
    if (v > 0) {
      parts.push(`${v}${label}`);
      remaining -= v * s;
    }
  }
  return parts.slice(0, 2).join(" ") || `${seconds}s`;
}

export function parseDurationSeconds(input?: string | null): number | null {
  if (!input) return null;
  const m = input.trim().toLowerCase().match(/^(\d+)\s*(s|m|h|d|w)?$/);
  if (!m) return null;
  const n = parseInt(m[1] ?? "0", 10);
  if (!n || n < 1) return null;
  const mult: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };
  return n * (mult[m[2] ?? "s"] ?? 1);
}

interface ModLogArgs {
  guild: Guild;
  type: PunishmentType;
  target: User | { id: string; tag?: string };
  moderator: User;
  reason?: string | null;
  durationSeconds?: number | null;
  extra?: { name: string; value: string; inline?: boolean }[];
  config?: ModerationConfig;
  caseNumber?: number | null;
  severity?: string | null;
  proofUrl?: string | null;
}

function buildEmbed(args: ModLogArgs, config: ModerationConfig) {
  const color = (config.embed_color ?? 0xed4245) as ColorResolvable;
  const targetTag = "tag" in args.target && args.target.tag ? args.target.tag : args.target.id;
  const title = args.caseNumber
    ? `🛡️ ${actionLabel(args.type)} · Caso #${args.caseNumber}`
    : `🛡️ ${actionLabel(args.type)}`;
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .addFields(
      { name: "Usuário", value: `<@${args.target.id}>\n\`${targetTag}\` · \`${args.target.id}\``, inline: true },
      { name: "Moderador", value: `<@${args.moderator.id}>`, inline: true },
      { name: "Duração", value: formatDuration(args.durationSeconds), inline: true },
      { name: "Motivo", value: args.reason?.slice(0, 1000) || "Sem motivo informado." },
    )
    .setFooter({ text: config.embed_footer ?? "Sistema de Moderação", iconURL: config.embed_icon_url ?? undefined })
    .setTimestamp(new Date());
  if (args.severity) embed.addFields({ name: "Severidade", value: args.severity, inline: true });
  if (args.proofUrl) {
    embed.addFields({ name: "Prova", value: args.proofUrl });
    if (/\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(args.proofUrl)) {
      embed.setImage(args.proofUrl);
    }
  }
  if (args.extra?.length) embed.addFields(args.extra);
  return embed;
}

export async function postModerationLog(args: ModLogArgs) {
  const config = args.config ?? (await getModerationConfig(args.guild.id));
  if (!config.log_channel_id) return;
  const eventKey = args.type.toLowerCase();
  if (config.enabled_log_events?.length && !config.enabled_log_events.includes(eventKey)) {
    return;
  }
  const channel = await args.guild.channels.fetch(config.log_channel_id).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) return;
  await channel.send({ embeds: [buildEmbed(args, config)] }).catch(() => null);
}

export async function dmPunishedUser(args: ModLogArgs) {
  const config = args.config ?? (await getModerationConfig(args.guild.id));
  if (!config.dm_punished_user) return;
  if (!("send" in args.target)) return;
  const tpl = config.punishment_dm_template ?? "";
  const content = tpl
    .replaceAll("{action}", actionLabel(args.type))
    .replaceAll("{guild}", args.guild.name)
    .replaceAll("{reason}", args.reason ?? "Sem motivo informado.")
    .replaceAll("{duration}", formatDuration(args.durationSeconds))
    .replaceAll("{moderator}", `<@${args.moderator.id}>`);
  const embed = new EmbedBuilder()
    .setColor((config.embed_color ?? 0xed4245) as ColorResolvable)
    .setTitle(`${actionLabel(args.type)} — ${args.guild.name}`)
    .setDescription(content || "Você recebeu uma ação de moderação.")
    .setFooter({ text: config.embed_footer ?? "Sistema de Moderação" })
    .setTimestamp(new Date());
  if (args.caseNumber) embed.addFields({ name: "Caso", value: `#${args.caseNumber}`, inline: true });

  const components: ActionRowBuilder<ButtonBuilder>[] = [];
  if (config.appeal_url) {
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Apelar").setURL(config.appeal_url),
      ),
    );
  }
  await (args.target as User).send({ embeds: [embed], components }).catch(() => null);
}
