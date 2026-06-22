/**
 * EmbedFactory — fábrica central de embeds com cor, footer e estilo por módulo.
 *
 * Uso:
 *   import { ui } from "../../systems/ui/embed.factory.js";
 *   await interaction.reply({ embeds: [ui.success({ title: "Pronto!", description: "..." })] });
 *
 * Variantes com kind = nome do módulo aplicam cor + footer automaticamente.
 * Embeds especializados (moderation/ticket/economy/...) montam fields e thumb.
 */
import { EmbedBuilder, type ColorResolvable } from "discord.js";
import { MODULE_COLOR, MODULE_FOOTER, EMOJI, type ModuleKind } from "./embed.theme.js";
import { getAsset, getAssetCached, type AssetKey } from "./embed.assets.js";

export interface BaseOpts {
  title?: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: string;
  footerIcon?: string;
  thumbnail?: string;
  image?: string;
  author?: { name: string; iconURL?: string };
  timestamp?: boolean;
  url?: string;
}

function build(kind: ModuleKind, opts: BaseOpts): EmbedBuilder {
  const e = new EmbedBuilder().setColor(MODULE_COLOR[kind] as ColorResolvable);
  if (opts.title) e.setTitle(opts.title);
  if (opts.description) e.setDescription(opts.description);
  if (opts.url) e.setURL(opts.url);
  if (opts.fields?.length) e.addFields(opts.fields);
  if (opts.thumbnail) e.setThumbnail(opts.thumbnail);
  if (opts.image) e.setImage(opts.image);
  if (opts.author) e.setAuthor(opts.author);
  e.setFooter({
    text: opts.footer ?? MODULE_FOOTER[kind],
    iconURL: opts.footerIcon,
  });
  if (opts.timestamp ?? true) e.setTimestamp(new Date());
  return e;
}

// Variantes novas adicionadas em Fase 4 (personalidade).
function celebration(opts: BaseOpts): EmbedBuilder {
  return build("social", {
    ...opts,
    title: opts.title ? `${EMOJI.sparkle} ${opts.title}` : `${EMOJI.sparkle} Boa!`,
  });
}

function tip(opts: { title?: string; description: string }): EmbedBuilder {
  return build("info", {
    title: opts.title ? `${EMOJI.info} ${opts.title}` : `${EMOJI.info} Dica rápida`,
    description: opts.description,
  });
}

function achievement(opts: { name: string; description: string; icon?: string }): EmbedBuilder {
  return build("social", {
    title: `${EMOJI.achievement} Conquista desbloqueada — ${opts.name}`,
    description: opts.description,
    thumbnail: opts.icon,
  });
}

// ===== Async helper para puxar assets de uma key =====
async function withAsset(
  guildId: string | null,
  key: AssetKey | undefined,
): Promise<string | undefined> {
  if (!key) return undefined;
  return getAsset(guildId, key);
}

// ===================== API pública =====================

export const ui = {
  // ----- Genéricos por tipo -----
  default: (o: BaseOpts) => build("default", o),
  success: (o: BaseOpts) =>
    build("success", { ...o, title: o.title ? `${EMOJI.ok} ${o.title}` : undefined }),
  error: (o: BaseOpts) =>
    build("error", { ...o, title: o.title ? `${EMOJI.fail} ${o.title}` : undefined }),
  warn: (o: BaseOpts) =>
    build("warn", { ...o, title: o.title ? `${EMOJI.warn} ${o.title}` : undefined }),
  info: (o: BaseOpts) =>
    build("info", { ...o, title: o.title ? `${EMOJI.info} ${o.title}` : undefined }),

  // ----- Moderação -----
  moderation(opts: {
    action: string;
    actionLabel?: string;
    caseId?: number | string;
    target?: { id: string; tag?: string };
    moderator?: { id: string; tag?: string };
    reason?: string;
    severity?: string;
    duration?: string;
    description?: string;
    proofUrl?: string;
    extraFields?: { name: string; value: string; inline?: boolean }[];
    guildId?: string;
  }): EmbedBuilder {
    const fields: { name: string; value: string; inline?: boolean }[] = [];
    if (opts.target)
      fields.push({
        name: "Usuário",
        value: `<@${opts.target.id}>${opts.target.tag ? `\n\`${opts.target.tag}\`` : ""}`,
        inline: true,
      });
    if (opts.moderator)
      fields.push({ name: "Moderador", value: `<@${opts.moderator.id}>`, inline: true });
    if (opts.severity) fields.push({ name: "Severidade", value: opts.severity, inline: true });
    if (opts.duration) fields.push({ name: "Duração", value: opts.duration, inline: true });
    if (opts.reason) fields.push({ name: "Motivo", value: opts.reason });
    if (opts.proofUrl) fields.push({ name: "Prova", value: opts.proofUrl });
    if (opts.extraFields?.length) fields.push(...opts.extraFields);

    const titleLabel = opts.actionLabel ?? opts.action;
    return build("moderation", {
      title: `${EMOJI.shield} ${titleLabel}${opts.caseId ? ` · Caso #${opts.caseId}` : ""}`,
      description:
        opts.description ??
        "Uma nova ação de moderação foi registrada no histórico do servidor.",
      fields,
      thumbnail: getAssetCached(opts.guildId ?? null, "moderation.icon_shield"),
    });
  },

  // ----- Tickets -----
  ticket(opts: {
    kind: "panel" | "created" | "closed" | "reopened" | "rated" | "assumed";
    title?: string;
    description?: string;
    fields?: { name: string; value: string; inline?: boolean }[];
    guildId?: string;
    image?: string;
  }): EmbedBuilder {
    const defaults: Record<typeof opts.kind, { title: string; description: string }> = {
      panel: {
        title: `${EMOJI.ticket} Central de Atendimento`,
        description:
          "Precisa de ajuda? Abra um ticket abaixo e nossa equipe responde rapidinho.",
      },
      created: {
        title: `${EMOJI.ticket} Ticket aberto`,
        description: "Seu atendimento foi criado. Conta pra gente o que precisa por aqui.",
      },
      closed: {
        title: `${EMOJI.ok} Atendimento finalizado`,
        description: "Esse ticket foi encerrado. Valeu por usar a Central de Atendimento.",
      },
      reopened: {
        title: `${EMOJI.bolt} Atendimento reaberto`,
        description: "O ticket voltou a ficar ativo.",
      },
      rated: {
        title: `${EMOJI.star} Avaliação registrada`,
        description: "Obrigado pelo feedback! Ele ajuda a melhorar o atendimento.",
      },
      assumed: {
        title: `${EMOJI.staff} Atendimento assumido`,
        description: "Um atendente já está com você.",
      },
    };
    const d = defaults[opts.kind];
    const isPanel = opts.kind === "panel";
    return build("tickets", {
      title: opts.title ?? d.title,
      description: opts.description ?? d.description,
      fields: opts.fields,
      image: opts.image ?? (isPanel ? getAssetCached(opts.guildId ?? null, "tickets.panel_banner") : undefined),
    });
  },

  // ----- Economia -----
  economy(opts: BaseOpts & { guildId?: string }): EmbedBuilder {
    return build("economy", {
      ...opts,
      title: opts.title ? `${EMOJI.coin} ${opts.title}` : undefined,
      thumbnail: opts.thumbnail ?? getAssetCached(opts.guildId ?? null, "economy.currency_icon"),
    });
  },

  // ----- Social / Level -----
  social(opts: BaseOpts & { guildId?: string }): EmbedBuilder {
    return build("social", { ...opts });
  },

  levelUp(opts: { userId: string; level: number; guildId?: string }): EmbedBuilder {
    return build("social", {
      title: `${EMOJI.sparkle} Boa! Subiu de nível`,
      description: `<@${opts.userId}> agora é **nível ${opts.level}**. Continue participando pra desbloquear novas recompensas.`,
      image: getAssetCached(opts.guildId ?? null, "social.levelup_banner"),
    });
  },

  // ----- Premium -----
  premium(opts: BaseOpts & { guildId?: string }): EmbedBuilder {
    return build("premium", {
      ...opts,
      title: opts.title ? `${EMOJI.vip} ${opts.title}` : undefined,
      thumbnail: opts.thumbnail ?? getAssetCached(opts.guildId ?? null, "premium.vip_badge"),
    });
  },

  premiumLocked(opts: { feature: string; guildId?: string }): EmbedBuilder {
    return build("premium", {
      title: `${EMOJI.vip} Recurso exclusivo Premium`,
      description: `**${opts.feature}** está disponível apenas para servidores premium. Faça o upgrade para liberar.`,
      image: getAssetCached(opts.guildId ?? null, "premium.locked_image"),
    });
  },

  // ----- Diversão -----
  fun(opts: BaseOpts & { gifKey?: AssetKey; guildId?: string }): EmbedBuilder {
    const image =
      opts.image ?? (opts.gifKey ? getAssetCached(opts.guildId ?? null, opts.gifKey) : undefined);
    return build("fun", { ...opts, image });
  },

  // ----- Logs -----
  log(opts: BaseOpts & { kind?: string }): EmbedBuilder {
    return build("logs", { ...opts });
  },

  // ----- Admin -----
  admin(opts: BaseOpts): EmbedBuilder {
    return build("default", { ...opts, title: opts.title ? `${EMOJI.gear} ${opts.title}` : undefined });
  },

  // ----- Variantes de personalidade (Fase 4) -----
  celebration,
  tip,
  achievement,

  // ----- Async helpers (quando precisar resolver asset agora) -----
  async resolveAsset(guildId: string | null, key: AssetKey): Promise<string | undefined> {
    return withAsset(guildId, key);
  },
};

export type UiFactory = typeof ui;
