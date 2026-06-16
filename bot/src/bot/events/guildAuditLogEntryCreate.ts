import { AuditLogEvent, Events, type GuildAuditLogsEntry } from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { getModerationConfig } from "../systems/moderation/moderation.service.js";
import { createCase, type CaseAction } from "../systems/moderation/cases.service.js";
import { postModerationLog } from "../systems/moderation/moderation.logger.js";
import { logger } from "../utils/logger.js";

const ACTION_MAP: Partial<Record<AuditLogEvent, CaseAction>> = {
  [AuditLogEvent.MemberBanAdd]: "BAN",
  [AuditLogEvent.MemberBanRemove]: "UNBAN",
  [AuditLogEvent.MemberKick]: "KICK",
};

const event: BotEvent<"guildAuditLogEntryCreate"> = {
  name: Events.GuildAuditLogEntryCreate,
  async execute(client, entry: GuildAuditLogsEntry, guild) {
    try {
      const action = ACTION_MAP[entry.action as AuditLogEvent];
      if (!action) return;
      if (!entry.executorId || entry.executorId === client.user?.id) return;
      const targetId = (entry.targetId ?? null) as string | null;
      if (!targetId) return;

      const config = await getModerationConfig(guild.id).catch(() => null);
      if (!config?.audit_log_enabled) return;

      const executor = await client.users.fetch(entry.executorId).catch(() => null);
      const target = await client.users.fetch(targetId).catch(() => null);

      const c = await createCase({
        guildId: guild.id,
        userId: targetId,
        userTag: target?.tag ?? null,
        moderatorId: entry.executorId,
        moderatorTag: executor?.tag ?? null,
        action,
        reason: entry.reason ?? "Ação manual via Discord",
        source: "DISCORD_UI",
      });

      if (executor) {
        await postModerationLog({
          guild,
          type: action === "UNBAN" ? "UNBAN" : action === "BAN" ? "BAN" : "KICK",
          target: target ?? { id: targetId, tag: targetId },
          moderator: executor,
          reason: entry.reason ?? "Ação manual via Discord",
          config,
          caseNumber: c.case_number,
          extra: [{ name: "Origem", value: "Discord (manual)", inline: true }],
        });
      }
    } catch (err) {
      logger.error({ err }, "auditLogWatcher falhou");
    }
  },
};

export default event;
