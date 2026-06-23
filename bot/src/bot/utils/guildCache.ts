import type { Guild as DiscordGuild } from "discord.js";
import { GuildConfig } from "../../database/models.js";
import { canWriteSupabase, supabase } from "../../database/supabase.js";
import { env } from "../../config/env.js";
import { logger } from "./logger.js";

/**
 * Garante que existem linhas mínimas para a guild no Supabase.
 * Não-bloqueante: retorna imediatamente e roda upserts em background.
 *
 * P9 fase 1: removidas as chamadas `Guild.updateOne`/`User.updateOne` do
 * shim Mongoose — eram no-ops (a tabela Mongo `guilds` não existe mais).
 * `GuildConfig` continua aqui só porque o `getConfig()` ainda lê campos
 * legados dele; será removido na fase 2 junto com `commands/config/config.ts`.
 */
export function ensureGuild(guild: DiscordGuild) {
  void GuildConfig.updateOne(
    { guildId: guild.id },
    { $setOnInsert: { guildId: guild.id } },
    { upsert: true },
  ).catch((err) => logger.warn({ err, guildId: guild.id }, "ensureGuild GuildConfig upsert falhou"));

  if (!canWriteSupabase) {
    logger.debug({ guildId: guild.id }, "supabase guild_configs upsert ignorado — service_role ausente");
    return;
  }
  void supabase
    .from("guild_configs")
    .upsert({ guild_id: guild.id }, { onConflict: "guild_id" })
    .then(({ error }) => {
      if (error) logger.warn({ err: error, guildId: guild.id }, "supabase guild_configs upsert falhou");
    });
}

function dashboardPresenceEndpoint(): string | null {
  const base = env.APP_URL?.trim().replace(/\/$/, "");
  if (!base) return null;
  return `${base}/api/public/bot-guild-presence`;
}

function guildPayload(guild: DiscordGuild) {
  return {
    id: guild.id,
    name: guild.name,
    icon: guild.icon,
    ownerId: guild.ownerId ?? null,
    memberCount: guild.memberCount ?? null,
  };
}

async function postPresence(body: unknown) {
  const endpoint = dashboardPresenceEndpoint();
  if (!endpoint) return;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bot ${env.DISCORD_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`dashboard presence ${res.status}: ${text.slice(0, 180)}`);
  }
}

export function recordGuildJoined(guild: DiscordGuild) {
  void postPresence({ event: "join", guild: guildPayload(guild) }).catch((err) =>
    logger.warn({ err, guildId: guild.id }, "falha ao marcar presença do bot no dashboard"),
  );
}

export function recordGuildLeft(guildId: string) {
  void postPresence({ event: "leave", guildId }).catch((err) =>
    logger.warn({ err, guildId }, "falha ao marcar saída do bot no dashboard"),
  );
}

export function syncBotGuildPresence(guilds: Iterable<DiscordGuild>) {
  const payload = [...guilds].map(guildPayload);
  void postPresence({ event: "sync", guilds: payload })
    .then(() => logger.info({ count: payload.length }, "presença do bot sincronizada com dashboard"))
    .catch((err) => logger.warn({ err }, "falha ao sincronizar presença do bot com dashboard"));
}

const CACHE_TTL_MS = 30_000;
type CachedCfg = { cfg: any; at: number };
const cache = new Map<string, CachedCfg>();

/**
 * Lê configuração unificada do servidor.
 * Junta em paralelo:
 *  - Mongo `GuildConfig` (legado / campos ainda não migrados)
 *  - Supabase `guild_configs`        → welcome
 *  - Supabase `economy_config`       → economia
 *  - Supabase `premium_guild_config` → VIP/Premium
 *  - Supabase `social_config`        → level/reputation/profile
 *  - Supabase `community_config`     → polls/suggestions
 *
 * Supabase vence em conflito — é o que o dashboard edita.
 */
export async function getConfig(guildId: string) {
  const hit = cache.get(guildId);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.cfg;

  let mongoDoc = await GuildConfig.findOne({ guildId });
  if (!mongoDoc) mongoDoc = await GuildConfig.create({ guildId });
  const cfg: any = mongoDoc.toObject ? mongoDoc.toObject() : { ...mongoDoc };

  const [guildRes, ecoRes, premiumRes, socialRes, commRes] = await Promise.all([
    supabase.from("guild_configs").select("*").eq("guild_id", guildId).maybeSingle(),
    supabase.from("economy_config").select("*").eq("guild_id", guildId).maybeSingle(),
    supabase.from("premium_guild_config").select("*").eq("guild_id", guildId).maybeSingle(),
    supabase.from("social_config").select("*").eq("guild_id", guildId).maybeSingle(),
    supabase.from("community_config").select("*").eq("guild_id", guildId).maybeSingle(),
  ]);

  // --- guild_configs (welcome) ---
  if (guildRes.error) {
    logger.warn({ err: guildRes.error, guildId }, "getConfig guild_configs falhou");
  } else if (guildRes.data) {
    const sup = guildRes.data as any;
    if (sup.welcome_enabled !== null && sup.welcome_enabled !== undefined) cfg.welcomeEnabled = sup.welcome_enabled;
    if (sup.welcome_channel_id) cfg.welcomeChannelId = sup.welcome_channel_id;
    if (sup.welcome_message) cfg.welcomeMessage = sup.welcome_message;
    if (sup.welcome_embed_enabled !== undefined) cfg.welcomeEmbedEnabled = sup.welcome_embed_enabled;
    if (sup.welcome_embed_color) cfg.welcomeEmbedColor = sup.welcome_embed_color;
  }

  // --- economy_config ---
  if (ecoRes.error) {
    logger.warn({ err: ecoRes.error, guildId }, "getConfig economy_config falhou");
  } else if (ecoRes.data) {
    const eco = ecoRes.data as any;
    if (eco.enabled !== null && eco.enabled !== undefined) cfg.economyEnabled = eco.enabled;
    if (eco.currency_name) cfg.economyCurrencyName = eco.currency_name;
    if (eco.currency_emoji) cfg.economyCurrencyEmoji = eco.currency_emoji;
    if (eco.daily_amount !== null && eco.daily_amount !== undefined) cfg.economyDailyAmount = eco.daily_amount;
    if (eco.work_min !== null && eco.work_min !== undefined) cfg.economyWorkMin = eco.work_min;
    if (eco.work_max !== null && eco.work_max !== undefined) cfg.economyWorkMax = eco.work_max;
    if (eco.work_cooldown_seconds !== null && eco.work_cooldown_seconds !== undefined) {
      cfg.economyWorkCooldownSeconds = eco.work_cooldown_seconds;
    }
  }

  // --- premium_guild_config (VIP) ---
  if (premiumRes.error) {
    logger.warn({ err: premiumRes.error, guildId }, "getConfig premium_guild_config falhou");
  } else if (premiumRes.data) {
    const p = premiumRes.data as any;
    if (p.vip_role_id) cfg.vipRoleId = p.vip_role_id;
    if (p.premium_role_id) cfg.premiumRoleId = p.premium_role_id;
    if (p.premium_log_channel_id) cfg.premiumLogChannelId = p.premium_log_channel_id;
    cfg.showPremiumBadges = p.show_premium_badges ?? cfg.showPremiumBadges;
    cfg.allowVipTickets = p.allow_vip_tickets ?? cfg.allowVipTickets;
    cfg.allowVipShopItems = p.allow_vip_shop_items ?? cfg.allowVipShopItems;
  }

  // --- social_config (level/reputation/profile) ---
  if (socialRes.error) {
    logger.warn({ err: socialRes.error, guildId }, "getConfig social_config falhou");
  } else if (socialRes.data) {
    const s = socialRes.data as any;
    if (s.level_enabled !== null && s.level_enabled !== undefined) cfg.levelEnabled = s.level_enabled;
    if (s.log_channel_id) cfg.levelUpChannelId = s.log_channel_id;
    if (Array.isArray(s.ignored_channel_ids)) cfg.noXpChannels = s.ignored_channel_ids;
    if (Array.isArray(s.ignored_role_ids)) cfg.noXpRoles = s.ignored_role_ids;
    cfg.reputationEnabled = s.reputation_enabled ?? cfg.reputationEnabled;
    cfg.profileEnabled = s.profile_enabled ?? cfg.profileEnabled;
    cfg.achievementsEnabled = s.achievements_enabled ?? cfg.achievementsEnabled;
    if (s.embed_color) cfg.levelEmbedColor = s.embed_color;
    if (s.active_season_id) cfg.activeSeasonId = s.active_season_id;
  }

  // --- community_config (polls/suggestions) ---
  if (commRes.error) {
    logger.warn({ err: commRes.error, guildId }, "getConfig community_config falhou");
  } else if (commRes.data) {
    const c = commRes.data as any;
    cfg.pollsEnabled = c.polls_enabled ?? cfg.pollsEnabled;
    if (c.polls_log_channel_id) cfg.pollsLogChannelId = c.polls_log_channel_id;
    if (c.polls_max_options !== null && c.polls_max_options !== undefined) cfg.pollsMaxOptions = c.polls_max_options;
    cfg.pollsAllowAnonymous = c.polls_allow_anonymous ?? cfg.pollsAllowAnonymous;
    cfg.suggestionsEnabled = c.suggestions_enabled ?? cfg.suggestionsEnabled;
    if (c.suggestions_channel_id) cfg.suggestionsChannelId = c.suggestions_channel_id;
    if (c.suggestions_log_channel_id) cfg.suggestionsLogChannelId = c.suggestions_log_channel_id;
    cfg.suggestionsRequireReason = c.suggestions_require_reason ?? cfg.suggestionsRequireReason;
    cfg.suggestionsAllowAnonymous = c.suggestions_allow_anonymous ?? cfg.suggestionsAllowAnonymous;
    cfg.suggestionsAllowVoting = c.suggestions_allow_voting ?? cfg.suggestionsAllowVoting;
  }

  cache.set(guildId, { cfg, at: Date.now() });
  return cfg;
}

export function invalidateGuildConfig(guildId: string) {
  cache.delete(guildId);
}

/**
 * Não-bloqueante: dispara upsert do user em background.
 */
export function ensureUser(id: string, username?: string | null) {
  void User.updateOne(
    { _id: id },
    {
      $set: { ...(username ? { username } : {}) },
      $setOnInsert: { _id: id },
    },
    { upsert: true },
  ).catch((err) => logger.warn({ err, userId: id }, "ensureUser falhou"));
}
