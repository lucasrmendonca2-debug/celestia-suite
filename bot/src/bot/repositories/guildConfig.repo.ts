import { supabase, canWriteSupabase } from "../../database/supabase.js";
import { logger } from "../utils/logger.js";

/**
 * P9 fase 2 — escrita direta no Supabase para configurações de guild.
 * Substitui chamadas ao shim Mongoose `GuildConfig`. Reads continuam via
 * `getConfig()` (utils/guildCache.ts), que já lê o Supabase como verdade.
 */

export async function ensureGuildConfigRow(guildId: string) {
  if (!canWriteSupabase) return;
  const { error } = await supabase
    .from("guild_configs")
    .upsert({ guild_id: guildId }, { onConflict: "guild_id" });
  if (error) logger.warn({ err: error, guildId }, "ensureGuildConfigRow falhou");
}

export async function updateGuildConfig(
  guildId: string,
  patch: Record<string, unknown>,
) {
  if (!canWriteSupabase) {
    logger.warn({ guildId }, "updateGuildConfig ignorado — service_role ausente");
    return;
  }
  const row = { guild_id: guildId, ...patch };
  const { error } = await supabase
    .from("guild_configs")
    .upsert(row, { onConflict: "guild_id" });
  if (error) {
    logger.error({ err: error, guildId, patch }, "updateGuildConfig falhou");
    throw error;
  }
}

export async function updateLogsConfig(
  guildId: string,
  patch: Record<string, unknown>,
) {
  if (!canWriteSupabase) return;
  const row = { guild_id: guildId, ...patch };
  const { error } = await supabase
    .from("guild_logs_config")
    .upsert(row, { onConflict: "guild_id" });
  if (error) {
    logger.error({ err: error, guildId, patch }, "updateLogsConfig falhou");
    throw error;
  }
}

export async function updatePremiumGuildConfig(
  guildId: string,
  patch: Record<string, unknown>,
) {
  if (!canWriteSupabase) return;
  const row = { guild_id: guildId, ...patch };
  const { error } = await supabase
    .from("premium_guild_config")
    .upsert(row, { onConflict: "guild_id" });
  if (error) {
    logger.error({ err: error, guildId, patch }, "updatePremiumGuildConfig falhou");
    throw error;
  }
}
