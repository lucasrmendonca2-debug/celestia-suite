import { EmbedBuilder } from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { postLog } from "../systems/logs/logger.service.js";

const event: BotEvent<"messageDeleteBulk"> = {
  name: "messageDeleteBulk",
  async execute(_client, messages, channel) {
    if (!channel.guild) return;
    const embed = new EmbedBuilder()
      .setTitle("🧹 Mensagens deletadas em massa")
      .setDescription(`**${messages.size}** mensagens deletadas em <#${channel.id}>`);
    await postLog({
      guild: channel.guild,
      category: "message",
      event: "messageDeleteBulk",
      toggleKey: "message_bulk_delete",
      channelId: channel.id,
      metadata: { count: messages.size },
      embed,
    });
  },
};

export default event;
