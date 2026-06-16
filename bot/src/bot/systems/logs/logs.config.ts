import { canWriteSupabase, supabase } from "../../../database/supabase.js";
import { logger } from "../../utils/logger.js";

export type LogsConfig = Record<string, unknown> & {
  guild_id: string;
  log_channel_id?: string | null;
  ignored_channels?: string[] | null;
  ignored_roles?: string[] | null;
  ignored_users?: string[] | null;
};

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { cfg: LogsConfig | null; at: number }>();

export async function getLogsConfig(guildId: string): Promise<LogsConfig | null> {
  const hit = cache.get(guildId);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.cfg;

  if (!canWriteSupabase) {
    logger.debug({ guildId }, "logs config ignorado — service_role ausente");
    cache.set(guildId, { cfg: null, at: Date.now() });
    return null;
  }

  const { data, error } = await supabase
    .from("guild_logs_config")
    .select("*")
    .eq("guild_id", guildId)
    .maybeSingle();

  if (error) {
    logger.warn({ err: error, guildId }, "falha ao ler guild_logs_config");
    cache.set(guildId, { cfg: null, at: Date.now() });
    return null;
  }

  const cfg = (data as LogsConfig | null) ?? null;
  cache.set(guildId, { cfg, at: Date.now() });
  return cfg;
}

export function invalidateLogsConfig(guildId: string) {
  cache.delete(guildId);
}

export const logsConfig = { getLogsConfig, invalidateLogsConfig };
export default logsConfig;
