/**
 * Helpers de embed padronizados por categoria.
 * Usado para garantir consistência visual entre comandos.
 */
import { EmbedBuilder, type ColorResolvable } from "discord.js";
import { BRAND } from "../../config/env.js";

export const PALETTE = {
  success: 0x22c55e,
  error: 0xef4444,
  warn: 0xf59e0b,
  info: 0x3b82f6,
  economy: 0xeab308,
  moderation: 0xdc2626,
  level: 0x8b5cf6,
  fun: 0xec4899,
  premium: 0xfbbf24,
  brand: BRAND.color,
} as const;

type Kind = keyof typeof PALETTE;

interface EmbedOpts {
  title?: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  image?: string | null;
  thumbnail?: string | null;
  footer?: string;
  url?: string;
}

function build(kind: Kind, opts: EmbedOpts): EmbedBuilder {
  const e = new EmbedBuilder()
    .setColor(PALETTE[kind] as ColorResolvable)
    .setTimestamp(new Date());
  if (opts.title) e.setTitle(opts.title);
  if (opts.description) e.setDescription(opts.description);
  if (opts.fields?.length) e.addFields(opts.fields);
  if (opts.image) e.setImage(opts.image);
  if (opts.thumbnail) e.setThumbnail(opts.thumbnail);
  if (opts.url) e.setURL(opts.url);
  e.setFooter({ text: opts.footer ?? BRAND.footer });
  return e;
}

export const embeds = {
  success: (o: EmbedOpts) => build("success", o),
  error: (o: EmbedOpts) => build("error", o),
  warn: (o: EmbedOpts) => build("warn", o),
  info: (o: EmbedOpts) => build("info", o),
  economy: (o: EmbedOpts) => build("economy", o),
  moderation: (o: EmbedOpts) => build("moderation", o),
  level: (o: EmbedOpts) => build("level", o),
  fun: (o: EmbedOpts) => build("fun", o),
  premium: (o: EmbedOpts) => build("premium", o),
  brand: (o: EmbedOpts) => build("brand", o),
};
