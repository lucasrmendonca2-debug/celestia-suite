import type { EmbedBuilder, Guild } from "discord.js";
import { canWriteSupabase, supabase } from "../../../database/supabase.js";
import { logger } from "../../utils/logger.js";
import { getLogsConfig } from "./logs.config.js";

type LogIdentity = { id?: string | null; tag?: string | null };

export interface PostLogArgs {
  guild: Guild;
  category: string;
  event: string;
  toggleKey?: string;
  actor?: LogIdentity;
  target?: LogIdentity;
  channelId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
  embed?: EmbedBuilder;
}

const CATEGORY_CHANNEL: Record<string, string> = {
  message: "message_channel_id",
  member: "member_channel_id",
  role: "role_channel_id",
  channel: "channel_channel_id",
  voice: "voice_channel_id",
  server: "server_channel_id",
  mod: "mod_channel_id",
  invite: "invite_channel_id",
};

function asJson(value: unknown) {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v)));
  } catch {
    return null;
  }
}

async function sendDiscordLog(args: PostLogArgs) {
  if (!args.embed) return;
  const cfg = await getLogsConfig(args.guild.id);
  if (!cfg) return;

  if (args.toggleKey && cfg[args.toggleKey] === false) return;
  if (args.channelId && cfg.ignored_channels?.includes(args.channelId)) return;
  if (args.actor?.id && cfg.ignored_users?.includes(args.actor.id)) return;
  if (args.target?.id && cfg.ignored_users?.includes(args.target.id)) return;

  const channelColumn = CATEGORY_CHANNEL[args.category] ?? "log_channel_id";
  const targetChannelId = (cfg[channelColumn] as string | null | undefined) ?? cfg.log_channel_id;
  if (!targetChannelId) return;

  const channel = await args.guild.channels.fetch(targetChannelId).catch(() => null);
  if (!channel || !("isTextBased" in channel) || !channel.isTextBased() || !("send" in channel)) return;
  await channel.send({ embeds: [args.embed] }).catch((err: unknown) =>
    logger.warn({ err, guildId: args.guild.id, channelId: targetChannelId }, "falha ao enviar log no Discord"),
  );
}

async function insertAuditLog(args: PostLogArgs) {
  if (!canWriteSupabase) return;
  const { error } = await supabase.from("server_audit_logs").insert({
    guild_id: args.guild.id,
    category: args.category,
    event: args.event,
    actor_id: args.actor?.id ?? null,
    actor_tag: args.actor?.tag ?? null,
    target_id: args.target?.id ?? null,
    target_tag: args.target?.tag ?? null,
    channel_id: args.channelId ?? null,
    before: asJson(args.before),
    after: asJson(args.after),
    metadata: asJson(args.metadata),
  });
  if (error) logger.warn({ err: error, guildId: args.guild.id, event: args.event }, "falha ao gravar audit log");
}

export async function postLog(args: PostLogArgs): Promise<void> {
  await Promise.all([insertAuditLog(args), sendDiscordLog(args)]);
}

export const logEvent = postLog;
export default { postLog, logEvent };
