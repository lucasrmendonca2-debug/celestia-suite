import { EmbedBuilder } from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { postLog } from "../systems/logs/logger.service.js";

const event: BotEvent<"voiceStateUpdate"> = {
  name: "voiceStateUpdate",
  async execute(_client, oldState, newState) {
    if (!newState.guild) return;
    const userId = newState.id;
    const tag = newState.member?.user.tag;
    let title: string | null = null;
    let desc: string | null = null;
    let event = "";

    if (!oldState.channelId && newState.channelId) {
      title = "🔊 Entrou em voz";
      desc = `<@${userId}> entrou em <#${newState.channelId}>`;
      event = "voiceJoin";
    } else if (oldState.channelId && !newState.channelId) {
      title = "🔇 Saiu da voz";
      desc = `<@${userId}> saiu de <#${oldState.channelId}>`;
      event = "voiceLeave";
    } else if (oldState.channelId !== newState.channelId) {
      title = "🔁 Mudou de canal de voz";
      desc = `<@${userId}>: <#${oldState.channelId}> → <#${newState.channelId}>`;
      event = "voiceMove";
    } else {
      return;
    }

    const embed = new EmbedBuilder().setTitle(title).setDescription(desc);
    await postLog({
      guild: newState.guild,
      category: "voice",
      event,
      toggleKey: "voice_state_update",
      actor: { id: userId, tag },
      channelId: newState.channelId ?? oldState.channelId ?? undefined,
      before: { channelId: oldState.channelId },
      after: { channelId: newState.channelId },
      embed,
    });
  },
};
export default event;
