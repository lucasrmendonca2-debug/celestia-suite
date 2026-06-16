import { EmbedBuilder } from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { postLog } from "../systems/logs/logger.service.js";

const event: BotEvent<"channelDelete"> = {
  name: "channelDelete",
  async execute(_client, channel) {
    if (!("guild" in channel) || !channel.guild) return;
    const embed = new EmbedBuilder()
      .setTitle("🗑️ Canal deletado")
      .setDescription([`**Nome:** \`${channel.name}\``, `**ID:** \`${channel.id}\``].join("\n"));
    await postLog({
      guild: channel.guild,
      category: "channel",
      event: "channelDelete",
      toggleKey: "channel_delete",
      target: { id: channel.id, tag: channel.name ?? undefined },
      channelId: channel.id,
      embed,
    });
  },
};
export default event;
