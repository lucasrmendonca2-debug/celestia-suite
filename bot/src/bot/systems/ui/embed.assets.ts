/**
 * Sistema central de assets visuais.
 *
 * - Cache em memória (TTL 5min) por (guildId, key).
 * - Fallback: row da guild → row global (guild_id=null) → hardcoded default → undefined.
 * - Nunca lança — se algo falhar, retorna o default ou undefined.
 *
 * Comandos consomem via getAsset(guildId, "tickets.panel_banner").
 */
import { supabase } from "../../../database/supabase.js";

export type AssetModule =
  | "GLOBAL"
  | "WELCOME"
  | "TICKETS"
  | "MODERATION"
  | "ECONOMY"
  | "SOCIAL"
  | "LEVEL"
  | "PREMIUM"
  | "FUN"
  | "LOGS"
  | "DASHBOARD";

export type AssetType =
  | "IMAGE"
  | "GIF"
  | "ICON"
  | "BANNER"
  | "THUMBNAIL"
  | "BADGE"
  | "EMOJI"
  | "BACKGROUND";

export interface AssetSpec {
  key: string;
  name: string;
  module: AssetModule;
  type: AssetType;
  /** Fallback hardcoded — usado se nenhuma row existir. */
  default?: string | null;
  description?: string;
}

/**
 * Catálogo único de todas as keys conhecidas.
 * Adicionar aqui antes de usar via getAsset().
 */
export const ASSET_KEYS = {
  // GLOBAL
  "global.logo": {
    key: "global.logo",
    name: "Logo do bot",
    module: "GLOBAL",
    type: "ICON",
    default: null,
    description: "Ícone redondo de 512px usado como thumbnail padrão.",
  },
  "global.banner": {
    key: "global.banner",
    name: "Banner principal",
    module: "GLOBAL",
    type: "BANNER",
    default: null,
  },
  "global.thumbnail_default": {
    key: "global.thumbnail_default",
    name: "Thumbnail padrão",
    module: "GLOBAL",
    type: "THUMBNAIL",
    default: null,
  },
  "global.footer_icon": {
    key: "global.footer_icon",
    name: "Ícone do footer",
    module: "GLOBAL",
    type: "ICON",
    default: null,
  },

  // WELCOME
  "welcome.banner": {
    key: "welcome.banner",
    name: "Banner de boas-vindas",
    module: "WELCOME",
    type: "BANNER",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/0068bdbe-fd14-4cbf-8899-b1faec347604/welcome-banner.png",
  },
  "welcome.goodbye_banner": {
    key: "welcome.goodbye_banner",
    name: "Banner de saída",
    module: "WELCOME",
    type: "BANNER",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/5f7098c5-afb7-414a-a142-55742f4cd52f/goodbye-banner.png",
  },
  "welcome.card_background": {
    key: "welcome.card_background",
    name: "Fundo do card de membro novo",
    module: "WELCOME",
    type: "BACKGROUND",
    default: null,
  },

  // TICKETS
  "tickets.panel_banner": {
    key: "tickets.panel_banner",
    name: "Banner do painel de tickets",
    module: "TICKETS",
    type: "BANNER",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/4c5f0884-173b-44d9-aaff-86d197cd2d1a/tickets-panel.png",
  },
  "tickets.icon_support": {
    key: "tickets.icon_support",
    name: "Ícone — Suporte",
    module: "TICKETS",
    type: "ICON",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/c56548ad-de38-4cc7-91fd-4de895eaf2d4/icon-support.png",
  },
  "tickets.icon_purchase": {
    key: "tickets.icon_purchase",
    name: "Ícone — Compras",
    module: "TICKETS",
    type: "ICON",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/eef561d6-6c43-4c1c-9fd1-35d52fd9e893/icon-purchase.png",
  },
  "tickets.icon_report": {
    key: "tickets.icon_report",
    name: "Ícone — Denúncia",
    module: "TICKETS",
    type: "ICON",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/f59e6b38-b66e-4836-a535-eefc799e7282/icon-report.png",
  },
  "tickets.icon_partnership": {
    key: "tickets.icon_partnership",
    name: "Ícone — Parceria",
    module: "TICKETS",
    type: "ICON",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/a6829dc4-dfce-4b5c-bbb5-a28e5a024618/icon-partnership.png",
  },
  "tickets.icon_vip": {
    key: "tickets.icon_vip",
    name: "Ícone — Atendimento VIP",
    module: "TICKETS",
    type: "ICON",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/e0d84c76-4b65-437e-8974-fd5b10bc5973/icon-vip.png",
  },
  "tickets.closed_image": {
    key: "tickets.closed_image",
    name: "Imagem de ticket fechado",
    module: "TICKETS",
    type: "IMAGE",
    default: null,
  },
  "tickets.rating_image": {
    key: "tickets.rating_image",
    name: "Imagem de avaliação",
    module: "TICKETS",
    type: "IMAGE",
    default: null,
  },

  // ECONOMY
  "economy.banner": {
    key: "economy.banner",
    name: "Banner da economia",
    module: "ECONOMY",
    type: "BANNER",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/4c51b6f3-0d3f-4601-9adf-7a4d067e2dbc/economy-banner.png",
  },
  "economy.currency_icon": {
    key: "economy.currency_icon",
    name: "Ícone da moeda",
    module: "ECONOMY",
    type: "ICON",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/bff227d2-1b59-4645-bcd2-eefa4409eb70/icon-coin.png",
  },
  "economy.daily_image": {
    key: "economy.daily_image",
    name: "Imagem do /daily",
    module: "ECONOMY",
    type: "IMAGE",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/a661aeef-19c3-4302-b13b-2908e6f9ca4f/economy-daily.png",
  },
  "economy.work_image": {
    key: "economy.work_image",
    name: "Imagem do /work",
    module: "ECONOMY",
    type: "IMAGE",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/f790f172-825a-4f22-8e37-603b1142f3c6/economy-work.png",
  },
  "economy.crime_image": {
    key: "economy.crime_image",
    name: "Imagem do /crime",
    module: "ECONOMY",
    type: "IMAGE",
    default: null,
  },
  "economy.shop_image": {
    key: "economy.shop_image",
    name: "Imagem da loja",
    module: "ECONOMY",
    type: "IMAGE",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/b6549235-8077-4d37-a098-37a55800320b/economy-shop.png",
  },
  "economy.top_image": {
    key: "economy.top_image",
    name: "Imagem do ranking",
    module: "ECONOMY",
    type: "IMAGE",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/51aefb23-35c8-4334-88b9-e69af00b21e8/economy-top.png",
  },

  // SOCIAL / LEVEL
  "social.rank_background": {
    key: "social.rank_background",
    name: "Fundo do rank card",
    module: "SOCIAL",
    type: "BACKGROUND",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/75e39633-fa30-4b31-87ed-47f4ff9587d3/rank-bg.png",
  },
  "social.profile_banner": {
    key: "social.profile_banner",
    name: "Banner de perfil",
    module: "SOCIAL",
    type: "BANNER",
    default: null,
  },
  "social.levelup_banner": {
    key: "social.levelup_banner",
    name: "Banner de level up",
    module: "LEVEL",
    type: "BANNER",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/d7d3ee65-9ff8-44c3-8207-cb611b3e3617/levelup-banner.png",
  },
  "social.frame_common": {
    key: "social.frame_common",
    name: "Moldura comum",
    module: "SOCIAL",
    type: "BADGE",
    default: null,
  },
  "social.frame_vip": {
    key: "social.frame_vip",
    name: "Moldura VIP",
    module: "SOCIAL",
    type: "BADGE",
    default: null,
  },
  "social.icon_rep": {
    key: "social.icon_rep",
    name: "Ícone de reputação",
    module: "SOCIAL",
    type: "ICON",
    default: null,
  },
  "social.icon_xp": {
    key: "social.icon_xp",
    name: "Ícone de XP",
    module: "SOCIAL",
    type: "ICON",
    default: null,
  },
  "social.icon_achievement": {
    key: "social.icon_achievement",
    name: "Ícone de conquistas",
    module: "SOCIAL",
    type: "ICON",
    default: null,
  },

  // PREMIUM
  "premium.banner": {
    key: "premium.banner",
    name: "Banner premium",
    module: "PREMIUM",
    type: "BANNER",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/0ad171e6-731d-463d-b621-76fdc7766b1c/premium-banner.png",
  },
  "premium.vip_badge": {
    key: "premium.vip_badge",
    name: "Badge VIP",
    module: "PREMIUM",
    type: "BADGE",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/6e249e46-fc12-4ea2-bbcd-257197a1d316/vip-badge.png",
  },
  "premium.locked_image": {
    key: "premium.locked_image",
    name: "Imagem de recurso bloqueado",
    module: "PREMIUM",
    type: "IMAGE",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/64a2e490-220c-4e45-944d-a7034b5c25f0/premium-locked.png",
  },
  "premium.plan_image": {
    key: "premium.plan_image",
    name: "Imagem do plano VIP",
    module: "PREMIUM",
    type: "IMAGE",
    default: null,
  },

  // FUN
  "fun.hug_gif": { key: "fun.hug_gif", name: "GIF abraço", module: "FUN", type: "GIF", default: null },
  "fun.kiss_gif": { key: "fun.kiss_gif", name: "GIF beijo", module: "FUN", type: "GIF", default: null },
  "fun.slap_gif": { key: "fun.slap_gif", name: "GIF tapa", module: "FUN", type: "GIF", default: null },
  "fun.pat_gif": { key: "fun.pat_gif", name: "GIF carinho", module: "FUN", type: "GIF", default: null },
  "fun.bonk_gif": { key: "fun.bonk_gif", name: "GIF bonk", module: "FUN", type: "GIF", default: null },
  "fun.cuddle_gif": { key: "fun.cuddle_gif", name: "GIF chamego", module: "FUN", type: "GIF", default: null },
  "fun.poke_gif": { key: "fun.poke_gif", name: "GIF cutucada", module: "FUN", type: "GIF", default: null },
  "fun.ship_image": { key: "fun.ship_image", name: "Imagem para ship", module: "FUN", type: "IMAGE", default: null },
  "fun.marriage_image": {
    key: "fun.marriage_image",
    name: "Imagem para casamento",
    module: "FUN",
    type: "IMAGE",
    default: null,
  },

  // MODERATION / LOGS
  "moderation.icon_ban": { key: "moderation.icon_ban", name: "Ícone ban", module: "MODERATION", type: "ICON", default: null },
  "moderation.icon_mute": { key: "moderation.icon_mute", name: "Ícone mute", module: "MODERATION", type: "ICON", default: null },
  "moderation.icon_warn": { key: "moderation.icon_warn", name: "Ícone warn", module: "MODERATION", type: "ICON", default: null },
  "moderation.icon_shield": {
    key: "moderation.icon_shield",
    name: "Ícone segurança",
    module: "MODERATION",
    type: "ICON",
    default: null,
  },
  "moderation.automod_banner": {
    key: "moderation.automod_banner",
    name: "Banner do automod",
    module: "MODERATION",
    type: "BANNER",
    default: "https://project--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app/__l5e/assets-v1/6e4d9b64-48e2-4600-9bc8-c0648a69a052/moderation-banner.png",
  },
  "logs.icon_message_deleted": {
    key: "logs.icon_message_deleted",
    name: "Ícone mensagem deletada",
    module: "LOGS",
    type: "ICON",
    default: null,
  },
} as const satisfies Record<string, AssetSpec>;

export type AssetKey = keyof typeof ASSET_KEYS;

// ===== Cache =====
const TTL_MS = 5 * 60 * 1000;
type CacheEntry = { url: string | undefined; expiresAt: number };
const cache = new Map<string, CacheEntry>();

function cacheKey(guildId: string | null, key: string): string {
  return `${guildId ?? "_global"}::${key}`;
}

/**
 * Resolve a URL de um asset. Nunca lança.
 * Ordem: cache → row(guildId,key) → row(null,key) → default hardcoded → undefined.
 */
export async function getAsset(
  guildId: string | null,
  key: AssetKey,
): Promise<string | undefined> {
  const spec = ASSET_KEYS[key];
  const ck = cacheKey(guildId, key);
  const hit = cache.get(ck);
  if (hit && hit.expiresAt > Date.now()) return hit.url;

  let url: string | undefined;
  try {
    if (guildId) {
      const { data } = await supabase
        .from("bot_assets")
        .select("url, active")
        .eq("guild_id", guildId)
        .eq("key", key)
        .maybeSingle();
      if (data?.active && data.url) url = data.url;
    }
    if (!url) {
      const { data } = await supabase
        .from("bot_assets")
        .select("url, active")
        .is("guild_id", null)
        .eq("key", key)
        .maybeSingle();
      if (data?.active && data.url) url = data.url;
    }
  } catch {
    // silencia: fallback abaixo
  }

  if (!url && spec.default) url = spec.default;
  cache.set(ck, { url, expiresAt: Date.now() + TTL_MS });
  return url;
}

/** Invalida cache de uma key específica em um guild (chamar após upsert/delete). */
export function invalidateAsset(guildId: string | null, key: AssetKey): void {
  cache.delete(cacheKey(guildId, key));
}

/** Versão síncrona para callers que não querem await — devolve undefined se não cacheado. */
export function getAssetCached(guildId: string | null, key: AssetKey): string | undefined {
  const hit = cache.get(cacheKey(guildId, key));
  return hit && hit.expiresAt > Date.now() ? hit.url : undefined;
}
