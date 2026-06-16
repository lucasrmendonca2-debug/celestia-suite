import type { EmbedBuilder, Guild } from "discord.js";
import { postLog } from "./logger.service.js";

const LEGACY_CHANNEL_TO_CATEGORY: Record<string, string> = {
  modLogChannelId: "mod",
  logChannelId: "server",
  memberLogChannelId: "member",
  messageLogChannelId: "message",
};

export async function sendLog(
  guild: Guild,
  legacyChannelKey: string,
  embed: EmbedBuilder,
  event: string,
  metadata?: unknown,
): Promise<void> {
  await postLog({
    guild,
    category: LEGACY_CHANNEL_TO_CATEGORY[legacyChannelKey] ?? "server",
    event,
    metadata,
    embed,
  });
}

export default { sendLog };
