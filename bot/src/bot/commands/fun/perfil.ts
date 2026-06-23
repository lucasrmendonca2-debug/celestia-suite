import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type AutocompleteInteraction,
  type ButtonInteraction,
  type APIEmbedField,
} from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";
import { brandEmbed } from "../../utils/embed.js";
import { Msg } from "../../utils/messages.js";
import {
  listShop,
  getUserInventory,
  getUserLoadout,
  saveUserLoadout,
  purchaseCosmetic,
  type Cosmetic,
  type CosmeticType,
} from "../../systems/cosmetics/cosmetics.service.js";

const RARITY_BADGE: Record<string, string> = {
  common: "⚪ Comum",
  rare: "🔵 Raro",
  epic: "🟣 Épico",
  legendary: "🟡 Lendário",
  seasonal: "🌟 Sazonal",
};

const TYPE_LABEL: Record<CosmeticType, string> = {
  banner: "Banner",
  frame: "Moldura",
  sticker: "Sticker",
  effect: "Efeito",
  background_pattern: "Padrão de fundo",
  badge_decoration: "Decoração de badge",
};

const SHOP_TYPES: CosmeticType[] = ["banner", "frame", "sticker", "effect"];
const PAGE_SIZE = 4;

function fmtPrice(coins: number, isOffer?: boolean, discount = 20): string {
  if (coins <= 0) return "Grátis";
  if (!isOffer) return `🪙 ${coins.toLocaleString("pt-BR")}`;
  const discounted = Math.floor((coins * (100 - discount)) / 100);
  return `~~🪙 ${coins.toLocaleString("pt-BR")}~~ → **🪙 ${discounted.toLocaleString("pt-BR")}** (−${discount}%)`;
}

function cardSvgUrl(userId: string): string {
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://zenoxbot.lovable.app";
  return `${appUrl.replace(/\/$/, "")}/api/public/profile/${userId}/card.svg?v=${Date.now()}`;
}

function cardImageUrl(userId: string): string {
  // Discord embeds don't render SVG — proxy through wsrv.nl to convert to PNG.
  const svg = cardSvgUrl(userId);
  return `https://wsrv.nl/?url=${encodeURIComponent(svg)}&output=png&n=-1`;
}

// ============= /perfil ver  &  /perfil preview =============

async function handleVer(ix: ChatInputCommandInteraction, targetId: string) {
  await ix.deferReply();
  const [loadout, inventory] = await Promise.all([
    getUserLoadout(targetId),
    getUserInventory(targetId),
  ]);
  const totalItems = inventory.length;

  const fields: APIEmbedField[] = [
    { name: "Itens no inventário", value: String(totalItems), inline: true },
    { name: "Layout", value: loadout?.card_layout ?? "classic", inline: true },
  ];
  if (loadout?.accent_color) {
    fields.push({ name: "Cor de destaque", value: `\`${loadout.accent_color}\``, inline: true });
  }
  if (loadout?.bio) {
    fields.push({ name: "Bio", value: loadout.bio });
  }

  return ix.editReply({
    embeds: [
      ui.social({
        title: `Perfil de ${targetId === ix.user.id ? "você" : `<@${targetId}>`}`,
        description: "Card visual do perfil. Personalize ainda mais em `/perfil loja`.",
        fields,
        image: cardImageUrl(targetId),
      }),
    ],
  });
}

// ============= /perfil loja (paginada + botões) =============

function buildShopView(items: Cosmetic[], type: CosmeticType, page: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const slice = items.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const fields: APIEmbedField[] = slice.map((c) => {
    const tag = c.is_rare_pick ? "🔥 RARO DO DIA · " : c.is_on_offer ? "💸 OFERTA · " : "";
    return {
      name: `${tag}${c.name}`,
      value: `${RARITY_BADGE[c.rarity] ?? c.rarity} · ${fmtPrice(c.price_coins, c.is_on_offer)}\n_${c.description ?? "Sem descrição."}_`,
      inline: false,
    };
  });

  const embed = ui.economy({
    title: `Loja de ${TYPE_LABEL[type]}s — página ${safePage + 1}/${totalPages}`,
    description: slice.length === 0
      ? `Sem ${TYPE_LABEL[type].toLowerCase()}s à venda agora.`
      : "Clique em um botão pra comprar. Use `/perfil equipar` depois.",
    fields,
    image: slice[0]?.preview_url ?? slice[0]?.image_url ?? undefined,
  });

  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  if (slice.length > 0) {
    const buyRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...slice.map((c) =>
        new ButtonBuilder()
          .setCustomId(`cosmetic:buy:${c.id}`)
          .setLabel(c.name.slice(0, 70))
          .setStyle(c.is_on_offer ? ButtonStyle.Success : ButtonStyle.Primary)
          .setEmoji(c.rarity === "legendary" ? "🟡" : c.rarity === "epic" ? "🟣" : c.rarity === "rare" ? "🔵" : "⚪"),
      ),
    );
    components.push(buyRow);
  }

  if (totalPages > 1) {
    const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`cosmetic:page:${type}:${safePage - 1}`)
        .setLabel("◀ Anterior")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(safePage === 0),
      new ButtonBuilder()
        .setCustomId(`cosmetic:page:${type}:${safePage + 1}`)
        .setLabel("Próxima ▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(safePage >= totalPages - 1),
    );
    components.push(navRow);
  }

  return { embed, components };
}

async function handleLoja(ix: ChatInputCommandInteraction) {
  const type = (ix.options.getString("tipo") ?? "banner") as CosmeticType;
  const items = await listShop({ type });
  if (items.length === 0) {
    return ix.reply({
      embeds: [
        brandEmbed({
          kind: "info",
          title: "Loja vazia",
          description: `Ainda não temos ${TYPE_LABEL[type].toLowerCase()}s à venda. Volta em breve!`,
        }),
      ],
      ephemeral: true,
    });
  }
  const { embed, components } = buildShopView(items, type, 0);
  return ix.reply({ embeds: [embed], components });
}

/** Handler dos botões cosmetic:* — chamado por interactionCreate. */
export async function handleCosmeticButton(ix: ButtonInteraction) {
  const [, action, ...rest] = ix.customId.split(":");

  if (action === "page") {
    const type = rest[0] as CosmeticType;
    const page = Number.parseInt(rest[1] ?? "0", 10) || 0;
    if (!SHOP_TYPES.includes(type)) return;
    const items = await listShop({ type });
    const { embed, components } = buildShopView(items, type, page);
    await ix.update({ embeds: [embed], components }).catch(() => {});
    return;
  }

  if (action === "buy") {
    const cosmeticId = rest[0];
    if (!cosmeticId) return;
    if (!ix.guildId) {
      return ix.reply({ content: Msg.guildOnly(), ephemeral: true });
    }
    await ix.deferReply({ ephemeral: true });
    const result = await purchaseCosmetic({
      userId: ix.user.id,
      guildId: ix.guildId,
      cosmeticId,
      useDiscount: true,
    });
    if (!result.ok) {
      const reasons: Record<string, string> = {
        already_owned: "Você já tem esse cosmético no inventário!",
        insufficient_funds: `Faltam 🪙 ${(result.needed ?? 0).toLocaleString("pt-BR")} pra comprar isso.`,
        expired: "Esse item não está mais disponível.",
        not_available_yet: "Esse item ainda não foi lançado.",
        not_found: "Item não encontrado.",
      };
      return ix.editReply({
        embeds: [brandEmbed({ kind: "error", title: "Compra não rolou", description: reasons[result.reason ?? ""] ?? "Tenta de novo." })],
      });
    }
    return ix.editReply({
      embeds: [
        ui.celebration({
          title: "Cosmético adquirido!",
          description: `Você pagou **🪙 ${(result.price_paid ?? 0).toLocaleString("pt-BR")}**${result.discount ? ` (com ${result.discount}% de desconto)` : ""}. Equipe com \`/perfil equipar\`.`,
          fields: [{ name: "Saldo restante", value: `🪙 ${(result.new_balance ?? 0).toLocaleString("pt-BR")}`, inline: true }],
        }),
      ],
    });
  }
}

// ============= /perfil equipar (com autocomplete) =============

async function handleEquipar(ix: ChatInputCommandInteraction) {
  const slot = ix.options.getString("tipo", true) as "banner" | "frame" | "effect" | "sticker";
  const cosmeticId = ix.options.getString("item", true);

  const inv = await getUserInventory(ix.user.id);
  // @ts-expect-error supabase join shape
  const owned = inv.find((x) => x.cosmetic_id === cosmeticId && x.profile_cosmetics?.type === slot);
  if (!owned) {
    return ix.reply({
      embeds: [
        brandEmbed({
          kind: "error",
          title: "Item não está no seu inventário",
          description: "Use o autocomplete pra ver só os itens que você tem.",
        }),
      ],
      ephemeral: true,
    });
  }

  let patch: Record<string, unknown>;
  if (slot === "sticker") {
    const loadout = await getUserLoadout(ix.user.id);
    const current = new Set(loadout?.sticker_ids ?? []);
    if (current.has(cosmeticId)) current.delete(cosmeticId);
    else {
      if (current.size >= 3) {
        return ix.reply({
          embeds: [brandEmbed({ kind: "warn", title: "Limite de stickers", description: "Você só pode equipar 3 stickers. Remova um antes." })],
          ephemeral: true,
        });
      }
      current.add(cosmeticId);
    }
    patch = { sticker_ids: Array.from(current) };
  } else {
    patch = { [`${slot}_id`]: cosmeticId };
  }

  const ok = await saveUserLoadout(ix.user.id, patch as never);
  if (!ok) {
    return ix.reply({
      embeds: [brandEmbed({ kind: "error", title: "Não consegui equipar", description: Msg.oops() })],
      ephemeral: true,
    });
  }
  return ix.reply({
    embeds: [
      brandEmbed({
        kind: "success",
        title: "Equipado!",
        // @ts-expect-error supabase join shape
        description: `**${owned.profile_cosmetics?.name ?? "Item"}** no slot **${slot}**.`,
      }),
    ],
    ephemeral: true,
  });
}

async function handleAutocomplete(ix: AutocompleteInteraction) {
  const sub = ix.options.getSubcommand(false);
  if (sub !== "equipar") return ix.respond([]);
  const focused = ix.options.getFocused(true);
  if (focused.name !== "item") return ix.respond([]);

  const slot = (ix.options.getString("tipo") ?? "banner") as CosmeticType;
  const inv = await getUserInventory(ix.user.id);
  const query = focused.value.toLowerCase();

  const matches = inv
    // @ts-expect-error supabase join shape
    .filter((x) => x.profile_cosmetics?.type === slot)
    .map((x) => ({
      // @ts-expect-error supabase join shape
      name: `${x.profile_cosmetics?.name ?? "Item"} (${RARITY_BADGE[x.profile_cosmetics?.rarity ?? "common"] ?? ""})`.slice(0, 100),
      // @ts-expect-error supabase join shape
      value: String(x.cosmetic_id),
      // @ts-expect-error supabase join shape
      slug: String(x.profile_cosmetics?.slug ?? ""),
      // @ts-expect-error supabase join shape
      nameLower: String(x.profile_cosmetics?.name ?? "").toLowerCase(),
    }))
    .filter((o) => !query || o.nameLower.includes(query) || o.slug.includes(query))
    .slice(0, 25)
    .map((o) => ({ name: o.name, value: o.value }));

  await ix.respond(matches);
}

// ============= Comando =============

const command: SlashCommand = {
  category: "fun",
  cooldown: 3,
  guildOnly: false,
  data: new SlashCommandBuilder()
    .setName("perfil")
    .setDescription("Mostra ou personaliza seu perfil visual.")
    .addSubcommand((s) =>
      s
        .setName("ver")
        .setDescription("Mostra seu card de perfil renderizado.")
        .addUserOption((o) => o.setName("usuario").setDescription("Quem você quer ver").setRequired(false)),
    )
    .addSubcommand((s) =>
      s
        .setName("preview")
        .setDescription("Vê o perfil de outra pessoa.")
        .addUserOption((o) => o.setName("usuario").setDescription("Usuário a visualizar").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("loja")
        .setDescription("Vê os cosméticos disponíveis na loja, com botões de compra.")
        .addStringOption((o) =>
          o
            .setName("tipo")
            .setDescription("Que tipo de cosmético")
            .addChoices(
              { name: "Banners", value: "banner" },
              { name: "Molduras", value: "frame" },
              { name: "Stickers", value: "sticker" },
              { name: "Efeitos", value: "effect" },
            ),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("equipar")
        .setDescription("Equipa um cosmético do seu inventário.")
        .addStringOption((o) =>
          o
            .setName("tipo")
            .setDescription("Tipo de cosmético")
            .setRequired(true)
            .addChoices(
              { name: "Banner", value: "banner" },
              { name: "Moldura", value: "frame" },
              { name: "Sticker", value: "sticker" },
              { name: "Efeito", value: "effect" },
            ),
        )
        .addStringOption((o) =>
          o
            .setName("item")
            .setDescription("Item do seu inventário")
            .setRequired(true)
            .setAutocomplete(true),
        ),
    ),
  async execute(ix) {
    const sub = ix.options.getSubcommand();
    if (sub === "ver") {
      const target = ix.options.getUser("usuario") ?? ix.user;
      return handleVer(ix, target.id);
    }
    if (sub === "preview") {
      const target = ix.options.getUser("usuario", true);
      return handleVer(ix, target.id);
    }
    if (sub === "loja") return handleLoja(ix);
    if (sub === "equipar") return handleEquipar(ix);
  },
  async autocomplete(ix) {
    return handleAutocomplete(ix);
  },
};

export default command;
