import { EmbedBuilder } from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { postLog } from "../systems/logs/logger.service.js";

const event: BotEvent<"channelUpdate"> = {
  name: "channelUpdate",
  async execute(_client, oldChannel, newChannel) {
    if (!("guild" in newChannel) || !newChannel.guild) return;
    const oldAny = oldChannel as { name?: string | null };
    const newAny = newChannel as { name?: string | null };
    if (oldAny.name === newAny.name) return; // só logamos rename, evita spam
    const embed = new EmbedBuilder()
      .setTitle("✏️ Canal renomeado")
      .setDescription(
        [`**Canal:** <#${newChannel.id}>`, `**Antes:** \`${oldAny.name ?? "?"}\``, `**Depois:** \`${newAny.name ?? "?"}\``].join("\n"),
      );
    await postLog({
      guild: newChannel.guild,
      category: "channel",
      event: "channelUpdate",
      toggleKey: "channel_update",
      target: { id: newChannel.id, tag: newAny.name ?? undefined },
      channelId: newChannel.id,
      before: { name: oldAny.name },
      after: { name: newAny.name },
      embed,
    });
  },
};
export default event;
