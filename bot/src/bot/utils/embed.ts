// Wrapper legado mantendo API antiga, mas agora com personalidade:
// - prefixo de emoji automático por kind
// - rotação leve de footer para humanizar
// - delega cores/footer ao theme central
import { EmbedBuilder, type ColorResolvable } from "discord.js";
import { BRAND } from "../../config/env.js";
import {
  MODULE_COLOR,
  MODULE_FOOTER,
  EMOJI,
  BRAND_NAME,
  type ModuleKind,
} from "../systems/ui/embed.theme.js";

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
  /** Desativa prefixo automático de emoji no título. */
  noEmojiPrefix?: boolean;
}

const TITLE_EMOJI: Partial<Record<ModuleKind, string>> = {
  success: EMOJI.ok,
  error: EMOJI.fail,
  warn: EMOJI.warn,
  info: EMOJI.info,
  premium: EMOJI.vip,
  economy: EMOJI.coin,
  tickets: EMOJI.ticket,
  moderation: EMOJI.shield,
  fun: EMOJI.sparkle,
  social: EMOJI.heart,
};

const FOOTER_FLAVOR = [
  "",
  " • feito com 💜",
  " • bot brasileiro",
  " • powered by café ☕",
  " • bora animar essa galera",
];

function pickFlavor(): string {
  // 20% das vezes adiciona um flavor leve no footer.
  if (Math.random() > 0.2) return "";
  return FOOTER_FLAVOR[Math.floor(Math.random() * FOOTER_FLAVOR.length)]!;
}

function prefixTitle(kind: ModuleKind, title: string | undefined, skip?: boolean): string | undefined {
  if (!title || skip) return title;
  const emoji = TITLE_EMOJI[kind];
  if (!emoji) return title;
  // Evita prefixar se o usuário já começou com emoji.
  const startsWithEmoji = /^\p{Extended_Pictographic}/u.test(title.trim());
  return startsWithEmoji ? title : `${emoji} ${title}`;
}

export function brandEmbed(opts: EmbedOptions = {}): EmbedBuilder {
  const kind = (opts.kind ?? "default") as ModuleKind;
  const color = MODULE_COLOR[kind] ?? BRAND.color;
  const embed = new EmbedBuilder().setColor(color as ColorResolvable);

  const title = prefixTitle(kind, opts.title, opts.noEmojiPrefix);
  if (title) embed.setTitle(title);
  if (opts.description) embed.setDescription(opts.description);

  const baseFooter = opts.footer ?? MODULE_FOOTER[kind] ?? BRAND.footer ?? BRAND_NAME;
  embed.setFooter({ text: `${baseFooter}${opts.footer ? "" : pickFlavor()}` });

  if (opts.thumbnail) embed.setThumbnail(opts.thumbnail);
  if (opts.image) embed.setImage(opts.image);
  if (opts.fields?.length) embed.addFields(opts.fields);
  if (opts.author) embed.setAuthor(opts.author);
  if (opts.timestamp ?? true) embed.setTimestamp(new Date());
  return embed;
}

// Re-export para compat com código antigo que faz `import { Emoji } from ...`
export const Emoji = {
  ok: EMOJI.ok,
  fail: EMOJI.fail,
  warn: EMOJI.warn,
  info: EMOJI.info,
  star: EMOJI.star,
  ticket: EMOJI.ticket,
  vip: EMOJI.vip,
  shield: EMOJI.shield,
  bolt: EMOJI.bolt,
  cog: EMOJI.gear,
  coin: EMOJI.coin,
  xp: EMOJI.xp,
  crown: EMOJI.crown,
} as const;
