import type { Client } from "discord.js";
import { supabase } from "../../../database/supabase.js";
import { logger } from "../../utils/logger.js";
import {
  deactivateTemporaryAction,
  getModerationConfig,
  listExpiredTemporaryActions,
} from "./moderation.service.js";
import { createCase } from "./cases.service.js";
import { postModerationLog } from "./moderation.logger.js";

const INTERVAL_MS = 30_000;

export function startModerationScheduler(client: Client) {
  setInterval(() => {
    void tick(client).catch((err) =>
      logger.error({ err }, "moderation scheduler tick falhou"),
    );
  }, INTERVAL_MS);
  logger.info("🛡️  Moderation scheduler iniciado (30s)");
}

async function tick(client: Client) {
  await expireTemporaryActions(client);
  await expireWarnings();
}

async function expireTemporaryActions(client: Client) {
  const rows = await listExpiredTemporaryActions();
  for (const row of rows) {
    const guild = client.guilds.cache.get(row.guild_id);
    if (!guild) {
      await deactivateTemporaryAction(row.id);
      continue;
    }
    try {
      if (row.action_type === "TEMP_BAN") {
        await guild.bans.remove(row.user_id, "tempban expirou").catch(() => null);
        const cfg = await getModerationConfig(guild.id).catch(() => null);
        if (cfg) {
          await postModerationLog({
            guild,
            type: "UNBAN",
            target: { id: row.user_id, tag: row.user_id },
            moderator: client.user!,
            reason: "Tempban expirou automaticamente",
            config: cfg,
          });
        }
        await createCase({
          guildId: guild.id,
          userId: row.user_id,
          moderatorId: client.user!.id,
          action: "UNBAN",
          reason: "Tempban expirou automaticamente",
          source: "BOT",
        });
      } else if (row.action_type === "TEMP_MUTE") {
        const member = await guild.members.fetch(row.user_id).catch(() => null);
        const cfg = await getModerationConfig(guild.id).catch(() => null);
        if (member) {
          if (cfg?.mute_role_id && member.roles.cache.has(cfg.mute_role_id)) {
            await member.roles.remove(cfg.mute_role_id, "tempmute expirou").catch(() => null);
          }
          if (member.isCommunicationDisabled()) {
            await member.timeout(null, "tempmute expirou").catch(() => null);
          }
        }
        if (cfg) {
          await postModerationLog({
            guild,
            type: "UNMUTE",
            target: { id: row.user_id, tag: row.user_id },
            moderator: client.user!,
            reason: "Tempmute expirou automaticamente",
            config: cfg,
          });
        }
        await createCase({
          guildId: guild.id,
          userId: row.user_id,
          moderatorId: client.user!.id,
          action: "UNMUTE",
          reason: "Tempmute expirou automaticamente",
          source: "BOT",
        });
      }
    } catch (err) {
      logger.error({ err, row }, "Falha ao expirar ação temporária");
    }
    await deactivateTemporaryAction(row.id);
  }
}

async function expireWarnings() {
  const { data, error } = await supabase
    .from("warnings")
    .update({ active: false })
    .eq("active", true)
    .not("expires_at", "is", null)
    .lte("expires_at", new Date().toISOString())
    .select("id");
  if (error) {
    logger.warn({ err: error }, "Falha ao expirar warnings");
    return;
  }
  if (data?.length) {
    logger.info({ count: data.length }, "⌛ Warnings expirados");
  }
}
