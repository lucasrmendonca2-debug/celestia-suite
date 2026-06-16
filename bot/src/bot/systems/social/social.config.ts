import { supabase } from "../../../database/supabase.js";

export interface SocialConfigRow {
  guild_id: string;
  enabled: boolean;
  level_enabled: boolean;
  profile_enabled: boolean;
  reputation_enabled: boolean;
  achievements_enabled: boolean;
  log_channel_id: string | null;
  ignored_channel_ids: string[];
  ignored_role_ids: string[];
  embed_color: string;
}

export interface LevelConfigRow {
  guild_id: string;
  enabled: boolean;
  min_xp_per_message: number;
  max_xp_per_message: number;
  cooldown_seconds: number;
  global_multiplier: number;
  vip_multiplier: number;
  level_up_channel_id: string | null;
  level_up_message: string;
  send_level_up_message: boolean;
  level_up_message_mode: "current_channel" | "fixed_channel" | "dm" | "disabled";
  delete_level_up_after_seconds: number;
  min_message_length: number;
}

const DEFAULT_SOCIAL: SocialConfigRow = {
  guild_id: "",
  enabled: true,
  level_enabled: true,
  profile_enabled: true,
  reputation_enabled: true,
  achievements_enabled: true,
  log_channel_id: null,
  ignored_channel_ids: [],
  ignored_role_ids: [],
  embed_color: "#5865F2",
};

const DEFAULT_LEVEL: LevelConfigRow = {
  guild_id: "",
  enabled: true,
  min_xp_per_message: 15,
  max_xp_per_message: 25,
  cooldown_seconds: 60,
  global_multiplier: 1.0,
  vip_multiplier: 2.0,
  level_up_channel_id: null,
  level_up_message: "Boa! {user} avançou para o nível {level}. Continue participando para desbloquear novas recompensas.",
  send_level_up_message: true,
  level_up_message_mode: "current_channel",
  delete_level_up_after_seconds: 0,
  min_message_length: 3,
};

// Cache simples em memória — TTL 60s
const socialCache = new Map<string, { row: SocialConfigRow; at: number }>();
const levelCache = new Map<string, { row: LevelConfigRow; at: number }>();
const TTL = 60_000;

export async function getSocialConfig(guildId: string): Promise<SocialConfigRow> {
  const cached = socialCache.get(guildId);
  if (cached && Date.now() - cached.at < TTL) return cached.row;
  const { data } = await supabase
    .from("social_config")
    .select("*")
    .eq("guild_id", guildId)
    .maybeSingle();
  const row = { ...DEFAULT_SOCIAL, ...(data ?? {}), guild_id: guildId } as SocialConfigRow;
  socialCache.set(guildId, { row, at: Date.now() });
  return row;
}

export async function getLevelConfig(guildId: string): Promise<LevelConfigRow> {
  const cached = levelCache.get(guildId);
  if (cached && Date.now() - cached.at < TTL) return cached.row;
  const { data } = await supabase
    .from("level_config")
    .select("*")
    .eq("guild_id", guildId)
    .maybeSingle();
  const row = { ...DEFAULT_LEVEL, ...(data ?? {}), guild_id: guildId } as LevelConfigRow;
  levelCache.set(guildId, { row, at: Date.now() });
  return row;
}

export function invalidateConfigCache(guildId: string) {
  socialCache.delete(guildId);
  levelCache.delete(guildId);
}
