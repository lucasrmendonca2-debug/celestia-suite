/**
 * Catálogo de keys conhecidas, espelhado do bot.
 * Mantém o dashboard guiando o usuário sem precisar adivinhar nome de key.
 */

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
  recommendedSize?: string;
  description?: string;
}

export const ASSET_CATALOG: AssetSpec[] = [
  // GLOBAL
  { key: "global.logo", name: "Logo do bot", module: "GLOBAL", type: "ICON", recommendedSize: "512x512" },
  { key: "global.banner", name: "Banner principal", module: "GLOBAL", type: "BANNER", recommendedSize: "1200x400" },
  { key: "global.thumbnail_default", name: "Thumbnail padrão", module: "GLOBAL", type: "THUMBNAIL", recommendedSize: "512x512" },
  { key: "global.footer_icon", name: "Ícone do footer", module: "GLOBAL", type: "ICON", recommendedSize: "64x64" },

  // WELCOME
  { key: "welcome.banner", name: "Banner de boas-vindas", module: "WELCOME", type: "BANNER", recommendedSize: "1200x400" },
  { key: "welcome.goodbye_banner", name: "Banner de saída", module: "WELCOME", type: "BANNER", recommendedSize: "1200x400" },
  { key: "welcome.card_background", name: "Fundo do card de membro novo", module: "WELCOME", type: "BACKGROUND", recommendedSize: "1200x500" },

  // TICKETS
  { key: "tickets.panel_banner", name: "Banner da central de tickets", module: "TICKETS", type: "BANNER", recommendedSize: "1200x400" },
  { key: "tickets.icon_support", name: "Ícone — Suporte", module: "TICKETS", type: "ICON", recommendedSize: "256x256" },
  { key: "tickets.icon_purchase", name: "Ícone — Compras", module: "TICKETS", type: "ICON", recommendedSize: "256x256" },
  { key: "tickets.icon_report", name: "Ícone — Denúncia", module: "TICKETS", type: "ICON", recommendedSize: "256x256" },
  { key: "tickets.icon_partnership", name: "Ícone — Parceria", module: "TICKETS", type: "ICON", recommendedSize: "256x256" },
  { key: "tickets.icon_vip", name: "Ícone — VIP", module: "TICKETS", type: "ICON", recommendedSize: "256x256" },
  { key: "tickets.closed_image", name: "Imagem de ticket fechado", module: "TICKETS", type: "IMAGE", recommendedSize: "1200x400" },
  { key: "tickets.rating_image", name: "Imagem de avaliação", module: "TICKETS", type: "IMAGE", recommendedSize: "1200x400" },

  // ECONOMY
  { key: "economy.banner", name: "Banner da economia", module: "ECONOMY", type: "BANNER", recommendedSize: "1200x400" },
  { key: "economy.currency_icon", name: "Ícone da moeda", module: "ECONOMY", type: "ICON", recommendedSize: "256x256" },
  { key: "economy.daily_image", name: "Imagem do /daily", module: "ECONOMY", type: "IMAGE", recommendedSize: "1200x400" },
  { key: "economy.work_image", name: "Imagem do /work", module: "ECONOMY", type: "IMAGE", recommendedSize: "1200x400" },
  { key: "economy.crime_image", name: "Imagem do /crime", module: "ECONOMY", type: "IMAGE", recommendedSize: "1200x400" },
  { key: "economy.shop_image", name: "Imagem da loja", module: "ECONOMY", type: "IMAGE", recommendedSize: "1200x400" },
  { key: "economy.top_image", name: "Imagem do ranking", module: "ECONOMY", type: "IMAGE", recommendedSize: "1200x400" },

  // SOCIAL / LEVEL
  { key: "social.rank_background", name: "Fundo do rank card", module: "SOCIAL", type: "BACKGROUND", recommendedSize: "1200x500" },
  { key: "social.profile_banner", name: "Banner de perfil", module: "SOCIAL", type: "BANNER", recommendedSize: "1200x400" },
  { key: "social.levelup_banner", name: "Banner de level up", module: "LEVEL", type: "BANNER", recommendedSize: "1200x400" },
  { key: "social.frame_common", name: "Moldura comum", module: "SOCIAL", type: "BADGE", recommendedSize: "512x512" },
  { key: "social.frame_vip", name: "Moldura VIP", module: "SOCIAL", type: "BADGE", recommendedSize: "512x512" },
  { key: "social.icon_rep", name: "Ícone de reputação", module: "SOCIAL", type: "ICON", recommendedSize: "256x256" },
  { key: "social.icon_xp", name: "Ícone de XP", module: "SOCIAL", type: "ICON", recommendedSize: "256x256" },
  { key: "social.icon_achievement", name: "Ícone de conquistas", module: "SOCIAL", type: "ICON", recommendedSize: "256x256" },

  // PREMIUM
  { key: "premium.banner", name: "Banner premium", module: "PREMIUM", type: "BANNER", recommendedSize: "1200x400" },
  { key: "premium.vip_badge", name: "Badge VIP", module: "PREMIUM", type: "BADGE", recommendedSize: "512x512" },
  { key: "premium.locked_image", name: "Recurso bloqueado", module: "PREMIUM", type: "IMAGE", recommendedSize: "1200x400" },
  { key: "premium.plan_image", name: "Imagem do plano VIP", module: "PREMIUM", type: "IMAGE", recommendedSize: "1200x400" },

  // FUN
  { key: "fun.hug_gif", name: "GIF abraço", module: "FUN", type: "GIF", recommendedSize: "480x270" },
  { key: "fun.kiss_gif", name: "GIF beijo", module: "FUN", type: "GIF", recommendedSize: "480x270" },
  { key: "fun.slap_gif", name: "GIF tapa", module: "FUN", type: "GIF", recommendedSize: "480x270" },
  { key: "fun.pat_gif", name: "GIF carinho", module: "FUN", type: "GIF", recommendedSize: "480x270" },
  { key: "fun.bonk_gif", name: "GIF bonk", module: "FUN", type: "GIF", recommendedSize: "480x270" },
  { key: "fun.cuddle_gif", name: "GIF chamego", module: "FUN", type: "GIF", recommendedSize: "480x270" },
  { key: "fun.poke_gif", name: "GIF cutucada", module: "FUN", type: "GIF", recommendedSize: "480x270" },
  { key: "fun.ship_image", name: "Imagem ship", module: "FUN", type: "IMAGE", recommendedSize: "1200x400" },
  { key: "fun.marriage_image", name: "Imagem casamento", module: "FUN", type: "IMAGE", recommendedSize: "1200x400" },

  // MODERATION / LOGS
  { key: "moderation.icon_ban", name: "Ícone ban", module: "MODERATION", type: "ICON", recommendedSize: "256x256" },
  { key: "moderation.icon_mute", name: "Ícone mute", module: "MODERATION", type: "ICON", recommendedSize: "256x256" },
  { key: "moderation.icon_warn", name: "Ícone warn", module: "MODERATION", type: "ICON", recommendedSize: "256x256" },
  { key: "moderation.icon_shield", name: "Ícone segurança", module: "MODERATION", type: "ICON", recommendedSize: "256x256" },
  { key: "moderation.automod_banner", name: "Banner do automod", module: "MODERATION", type: "BANNER", recommendedSize: "1200x400" },
  { key: "logs.icon_message_deleted", name: "Ícone mensagem deletada", module: "LOGS", type: "ICON", recommendedSize: "256x256" },
];

export const MODULE_LABEL: Record<AssetModule, string> = {
  GLOBAL: "Global",
  WELCOME: "Boas-vindas",
  TICKETS: "Tickets",
  MODERATION: "Moderação",
  ECONOMY: "Economia",
  SOCIAL: "Social",
  LEVEL: "Level",
  PREMIUM: "Premium",
  FUN: "Diversão",
  LOGS: "Logs",
  DASHBOARD: "Dashboard",
};
