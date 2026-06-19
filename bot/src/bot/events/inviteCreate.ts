import { EmbedBuilder, Guild } from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { postLog } from "../systems/logs/logger.service.js";

const event: BotEvent<"inviteCreate"> = {
  name: "inviteCreate",
  async execute(_client, invite) {
    if (!invite.guild || !(invite.guild instanceof Guild)) return;
    const inviter = invite.inviter;
    const embed = new EmbedBuilder()
      .setTitle("🔗 Convite criado")
      .setDescription(
        [
          `**Código:** \`${invite.code}\``,
          `**Canal:** ${invite.channelId ? `<#${invite.channelId}>` : "?"}`,
          `**Por:** ${inviter ? `<@${inviter.id}>` : "?"}`,
          `**Usos máx.:** ${invite.maxUses || "∞"}`,
          `**Expira:** ${invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : "nunca"}`,
        ].join("\n"),
      );
    await postLog({
      guild: invite.guild,
      category: "invite",
      event: "inviteCreate",
      toggleKey: "invite_create",
      actor: inviter ? { id: inviter.id, tag: inviter.tag } : undefined,
      channelId: invite.channelId,
      metadata: { code: invite.code, maxUses: invite.maxUses },
      embed,
    });
  },
};
export default event;
