// Atualizar brandEmbed para usar a paleta central, mantendo a API legada.
import { EmbedBuilder, type ColorResolvable } from "discord.js";
import { BRAND } from "../../config/env.js";
import { MODULE_COLOR, MODULE_FOOTER, type ModuleKind } from "../systems/ui/embed.theme.js";

type EmbedKind = "default" | "success" | "warn" | "error" | "info";

interface EmbedOptions {
  kind?: EmbedKind | ModuleKind;
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
  const kind = (opts.kind ?? "default") as ModuleKind;
  const color = MODULE_COLOR[kind] ?? BRAND.color;
  const embed = new EmbedBuilder().setColor(color as ColorResolvable);
  if (opts.title) embed.setTitle(opts.title);
  if (opts.description) embed.setDescription(opts.description);
  if (opts.footer ?? true) embed.setFooter({ text: opts.footer ?? MODULE_FOOTER[kind] ?? BRAND.footer });
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
  coin: "🪙",
  xp: "📈",
  crown: "👑",
} as const;
