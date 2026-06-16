import { EmbedBuilder } from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { postLog } from "../systems/logs/logger.service.js";

const event: BotEvent<"channelCreate"> = {
  name: "channelCreate",
  async execute(_client, channel) {
    if (!("guild" in channel) || !channel.guild) return;
    const embed = new EmbedBuilder()
      .setTitle("➕ Canal criado")
      .setDescription([`**Canal:** <#${channel.id}> (\`${channel.name}\`)`, `**Tipo:** ${channel.type}`].join("\n"));
    await postLog({
      guild: channel.guild,
      category: "channel",
      event: "channelCreate",
      toggleKey: "channel_create",
      target: { id: channel.id, tag: channel.name ?? undefined },
      channelId: channel.id,
      embed,
    });
  },
};
export default event;
