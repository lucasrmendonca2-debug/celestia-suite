/**
 * Identidade visual central do Zenox.
 * Single source of truth para cores, footers e emojis por módulo.
 */

export const BRAND_NAME = "Zenox";

export const COLORS = {
  brand: 0xf59e0b,        // âmbar Zenox (cor principal)
  brand_warm: 0xea580c,   // laranja queimado
  brand_glow: 0xfbbf24,   // âmbar claro
  success: 0x22c55e,
  error: 0xef4444,
  warn: 0xf59e0b,
  info: 0x3b82f6,
  premium: 0xf5c842,
  economy: 0xfbbf24,
  tickets: 0xf97316,
  moderation: 0xdc2626,
  fun: 0xec4899,
  social: 0xa855f7,
  logs: 0x64748b,
  neutral: 0x1c1917,
} as const;

export type ModuleKind =
  | "default"
  | "success"
  | "error"
  | "warn"
  | "info"
  | "premium"
  | "economy"
  | "tickets"
  | "moderation"
  | "fun"
  | "social"
  | "logs";

export const MODULE_COLOR: Record<ModuleKind, number> = {
  default: COLORS.brand,
  success: COLORS.success,
  error: COLORS.error,
  warn: COLORS.warn,
  info: COLORS.info,
  premium: COLORS.premium,
  economy: COLORS.economy,
  tickets: COLORS.tickets,
  moderation: COLORS.moderation,
  fun: COLORS.fun,
  social: COLORS.social,
  logs: COLORS.logs,
};

export const MODULE_FOOTER: Record<ModuleKind, string> = {
  default: `${BRAND_NAME}`,
  success: `${BRAND_NAME} • Concluído`,
  error: `${BRAND_NAME} • Algo deu errado`,
  warn: `${BRAND_NAME} • Atenção`,
  info: `${BRAND_NAME} • Informação`,
  premium: `${BRAND_NAME} Premium`,
  economy: `${BRAND_NAME} • Economia`,
  tickets: `${BRAND_NAME} • Central de Atendimento`,
  moderation: `${BRAND_NAME} • Sistema de Moderação`,
  fun: `${BRAND_NAME} • Diversão`,
  social: `${BRAND_NAME} • Social`,
  logs: `${BRAND_NAME} • Logs`,
};

export const EMOJI = {
  ok: "✅",
  fail: "❌",
  warn: "⚠️",
  info: "💡",
  loading: "⏳",
  star: "⭐",
  sparkle: "✨",
  coin: "🪙",
  xp: "📈",
  vip: "💎",
  crown: "👑",
  ticket: "🎫",
  shield: "🛡️",
  hammer: "🔨",
  mute: "🔇",
  bolt: "⚡",
  rocket: "🚀",
  fire: "🔥",
  heart: "❤️",
  trophy: "🏆",
  gear: "⚙️",
  staff: "🛠️",
  shop: "🛒",
  ranking: "🏅",
  achievement: "🎖️",
} as const;
