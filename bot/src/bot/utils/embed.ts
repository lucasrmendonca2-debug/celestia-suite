import { EmbedBuilder, type ColorResolvable } from "discord.js";
import { BRAND } from "../../config/env.js";

type EmbedKind = "default" | "success" | "warn" | "error" | "info";

const COLORS: Record<EmbedKind, number> = {
  default: BRAND.color,
  success: 0x22c55e,
  warn: 0xf59e0b,
  error: 0xef4444,
  info: 0x3b82f6,
};

interface EmbedOptions {
  kind?: EmbedKind;
  title?: string;
  description?: string;
  footer?: string;
  thumbnail?: string;
  image?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  timestamp?: boolean;
  author?: { name: string; iconURL?: string };
}

export function brandEmbed(opts: EmbedOptions = {}): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(COLORS[opts.kind ?? "default"] as ColorResolvable);
  if (opts.title) embed.setTitle(opts.title);
  if (opts.description) embed.setDescription(opts.description);
  if (opts.footer ?? true) embed.setFooter({ text: opts.footer ?? BRAND.footer });
  if (opts.thumbnail) embed.setThumbnail(opts.thumbnail);
  if (opts.image) embed.setImage(opts.image);
  if (opts.fields?.length) embed.addFields(opts.fields);
  if (opts.author) embed.setAuthor(opts.author);
  if (opts.timestamp ?? true) embed.setTimestamp(new Date());
  return embed;
}

export const Emoji = {
  ok: "✅",
  fail: "❌",
  warn: "⚠️",
  info: "ℹ️",
  star: "⭐",
  ticket: "🎫",
  vip: "💎",
  shield: "🛡️",
  bolt: "⚡",
  cog: "⚙️",
} as const;
