import type { Guild as DiscordGuild } from "discord.js";
import { Guild, GuildConfig, User } from "../../database/models.js";
import { supabase } from "../../database/supabase.js";
import { logger } from "./logger.js";


export async function ensureGuild(guild: DiscordGuild) {
  await Guild.updateOne(
    { _id: guild.id },
    { $set: { name: guild.name }, $setOnInsert: { _id: guild.id } },
    { upsert: true },
  );
  await GuildConfig.updateOne({ guildId: guild.id }, { $setOnInsert: { guildId: guild.id } }, { upsert: true });
  // Garante linha no Supabase (dashboard ↔ bot)
  await supabase
    .from("guild_configs")
    .upsert({ guild_id: guild.id }, { onConflict: "guild_id" })
    .then(({ error }) => {
      if (error) logger.warn({ err: error, guildId: guild.id }, "supabase guild_configs upsert falhou");
    });
}

const CACHE_TTL_MS = 30_000;
type CachedCfg = { cfg: any; at: number };
const cache = new Map<string, CachedCfg>();

/**
 * Lê configuração do servidor mesclando:
 *  - Mongo `GuildConfig` (legado / campos ainda não migrados)
 *  - Supabase `public.guild_configs` (fonte de verdade do dashboard p/ welcome & afins)
 *
 * Supabase vence em conflito — é o que o dashboard edita.
 */
export async function getConfig(guildId: string) {
  const hit = cache.get(guildId);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.cfg;

  let mongoDoc = await GuildConfig.findOne({ guildId });
  if (!mongoDoc) mongoDoc = await GuildConfig.create({ guildId });
  const cfg: any = mongoDoc.toObject ? mongoDoc.toObject() : { ...mongoDoc };

  const { data: sup, error } = await supabase
    .from("guild_configs")
    .select("*")
    .eq("guild_id", guildId)
    .maybeSingle();

  if (error) {
    logger.warn({ err: error, guildId }, "getConfig supabase read falhou — usando apenas Mongo");
  } else if (sup) {
    if (sup.welcome_enabled !== null && sup.welcome_enabled !== undefined) cfg.welcomeEnabled = sup.welcome_enabled;
    if (sup.welcome_channel_id) cfg.welcomeChannelId = sup.welcome_channel_id;
    if (sup.welcome_message) cfg.welcomeMessage = sup.welcome_message;
  }

  cache.set(guildId, { cfg, at: Date.now() });
  return cfg;
}

export function invalidateGuildConfig(guildId: string) {
  cache.delete(guildId);
}

export async function ensureUser(id: string, username?: string | null) {
  await User.updateOne(
    { _id: id },
    {
      $set: { ...(username ? { username } : {}) },
      $setOnInsert: { _id: id },
    },
    { upsert: true },
  );
}
