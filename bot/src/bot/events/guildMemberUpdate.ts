import { EmbedBuilder } from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { postLog } from "../systems/logs/logger.service.js";

const event: BotEvent<"guildMemberUpdate"> = {
  name: "guildMemberUpdate",
  async execute(_client, oldMember, newMember) {
    if (oldMember.partial) return;
    const guild = newMember.guild;
    const target = { id: newMember.id, tag: newMember.user.tag };

    if (oldMember.nickname !== newMember.nickname) {
      const embed = new EmbedBuilder()
        .setTitle("📝 Apelido alterado")
        .setDescription(
          [
            `**Usuário:** <@${newMember.id}>`,
            `**Antes:** ${oldMember.nickname ?? "_nenhum_"}`,
            `**Depois:** ${newMember.nickname ?? "_nenhum_"}`,
          ].join("\n"),
        );
      await postLog({
        guild,
        category: "member",
        event: "memberNicknameUpdate",
        toggleKey: "member_nickname_update",
        target,
        before: { nickname: oldMember.nickname },
        after: { nickname: newMember.nickname },
        embed,
      });
    }

    const oldRoles = new Set(oldMember.roles.cache.keys());
    const newRoles = new Set(newMember.roles.cache.keys());
    const added = [...newRoles].filter((r) => !oldRoles.has(r));
    const removed = [...oldRoles].filter((r) => !newRoles.has(r));
    if (added.length || removed.length) {
      const embed = new EmbedBuilder()
        .setTitle("🎭 Cargos alterados")
        .setDescription(
          [
            `**Usuário:** <@${newMember.id}>`,
            added.length ? `**+ Adicionados:** ${added.map((r) => `<@&${r}>`).join(" ")}` : "",
            removed.length ? `**− Removidos:** ${removed.map((r) => `<@&${r}>`).join(" ")}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        );
      await postLog({
        guild,
        category: "member",
        event: "memberRoleUpdate",
        toggleKey: "member_role_update",
        target,
        before: { roles: [...oldRoles] },
        after: { roles: [...newRoles] },
        embed,
      });
    }

    const oldTo = oldMember.communicationDisabledUntilTimestamp ?? null;
    const newTo = newMember.communicationDisabledUntilTimestamp ?? null;
    if (oldTo !== newTo) {
      const embed = new EmbedBuilder()
        .setTitle(newTo ? "⏱️ Timeout aplicado" : "✅ Timeout removido")
        .setDescription(
          [
            `**Usuário:** <@${newMember.id}>`,
            newTo
              ? `**Expira:** <t:${Math.floor(newTo / 1000)}:R>`
              : `**Removido em:** <t:${Math.floor(Date.now() / 1000)}:f>`,
          ].join("\n"),
        );
      await postLog({
        guild,
        category: "member",
        event: newTo ? "memberTimeoutAdd" : "memberTimeoutRemove",
        toggleKey: "member_timeout",
        target,
        before: { timeout: oldTo },
        after: { timeout: newTo },
        embed,
      });
    }
  },
};

export default event;
