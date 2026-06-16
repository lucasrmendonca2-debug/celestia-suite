import { EmbedBuilder } from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { postLog } from "../systems/logs/logger.service.js";

const event: BotEvent<"inviteDelete"> = {
  name: "inviteDelete",
  async execute(_client, invite) {
    if (!invite.guild || invite.guild.partial) return;
    const embed = new EmbedBuilder()
      .setTitle("🔗 Convite deletado")
      .setDescription([`**Código:** \`${invite.code}\``, `**Canal:** ${invite.channelId ? `<#${invite.channelId}>` : "?"}`].join("\n"));
    await postLog({
      guild: invite.guild as never,
      category: "invite",
      event: "inviteDelete",
      toggleKey: "invite_delete",
      channelId: invite.channelId,
      metadata: { code: invite.code },
      embed,
    });
  },
};
export default event;
