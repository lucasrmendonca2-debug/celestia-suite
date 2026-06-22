import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
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

function fmtPrice(coins: number, isOffer?: boolean, discount = 20): string {
  if (coins <= 0) return "Grátis";
  if (!isOffer) return `🪙 ${coins.toLocaleString("pt-BR")}`;
  const discounted = Math.floor((coins * (100 - discount)) / 100);
  return `~~🪙 ${coins.toLocaleString("pt-BR")}~~ → **🪙 ${discounted.toLocaleString("pt-BR")}** (−${discount}%)`;
}

async function handleVer(ix: ChatInputCommandInteraction, targetId: string) {
  await ix.deferReply();
  const [loadout, inventory] = await Promise.all([
    getUserLoadout(targetId),
    getUserInventory(targetId),
  ]);
  const totalItems = inventory.length;

  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: "Itens no inventário", value: String(totalItems), inline: true },
    { name: "Layout", value: loadout?.card_layout ?? "classic", inline: true },
  ];
  if (loadout?.accent_color) {
    fields.push({ name: "Cor de destaque", value: `\`${loadout.accent_color}\``, inline: true });
  }
  if (loadout?.bio) {
    fields.push({ name: "Bio", value: loadout.bio });
  }

  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://zenoxbot.lovable.app";
  const cardUrl = `${appUrl.replace(/\/$/, "")}/api/public/profile/${targetId}/card.svg?v=${Date.now()}`;

  return ix.editReply({
    embeds: [
      ui.social({
        title: `Perfil de ${targetId === ix.user.id ? "você" : `<@${targetId}>`}`,
        description: totalItems === 0
          ? "Esse perfil ainda está cru. Compre cosméticos em `/perfil loja` pra personalizar."
          : "Visual do perfil renderizado com os cosméticos equipados.",
        fields,
        image: cardUrl,
      }),
    ],
  });
}


async function handleLoja(ix: ChatInputCommandInteraction) {
  const type = (ix.options.getString("tipo") ?? "banner") as CosmeticType;
  const items = await listShop({ type });
  if (items.length === 0) {
    return ix.reply({
      embeds: [
        brandEmbed({
          kind: "info",
          title: `Loja vazia`,
          description: `Ainda não temos ${TYPE_LABEL[type].toLowerCase()}s à venda. Volta em breve!`,
        }),
      ],
      ephemeral: true,
    });
  }

  const lines = items.slice(0, 10).map((c) => {
    const tag = c.is_rare_pick ? "🔥 RARO DO DIA · " : c.is_on_offer ? "💸 OFERTA · " : "";
    return `${tag}**${c.name}** · ${RARITY_BADGE[c.rarity] ?? c.rarity}\n${fmtPrice(c.price_coins, c.is_on_offer)} · \`${c.slug}\``;
  });

  return ix.reply({
    embeds: [
      ui.economy({
        guildId: ix.guildId ?? undefined,
        title: `Loja de ${TYPE_LABEL[type]}s`,
        description: lines.join("\n\n"),
        footer: "Use /perfil comprar <slug> pra adquirir um item",
      }),
    ],
  });
}

async function handleComprar(ix: ChatInputCommandInteraction) {
  if (!ix.guildId) return ix.reply({ content: Msg.guildOnly(), ephemeral: true });
  const slug = ix.options.getString("item", true);
  const items = await listShop();
  const item = items.find((c) => c.slug === slug);
  if (!item) {
    return ix.reply({
      embeds: [brandEmbed({ kind: "error", title: "Item não encontrado", description: `Não achei \`${slug}\` na loja.` })],
      ephemeral: true,
    });
  }

  const result = await purchaseCosmetic({
    userId: ix.user.id,
    guildId: ix.guildId,
    cosmeticId: item.id,
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
    return ix.reply({
      embeds: [brandEmbed({ kind: "error", title: "Compra não rolou", description: reasons[result.reason ?? ""] ?? "Tenta de novo." })],
      ephemeral: true,
    });
  }

  return ix.reply({
    embeds: [
      ui.celebration({
        title: `${item.name} adquirido!`,
        description: `Você pagou **🪙 ${(result.price_paid ?? 0).toLocaleString("pt-BR")}**${result.discount ? ` (com ${result.discount}% de desconto)` : ""}. Equipe com \`/perfil equipar\`.`,
        fields: [{ name: "Saldo restante", value: `🪙 ${(result.new_balance ?? 0).toLocaleString("pt-BR")}`, inline: true }],
        image: item.preview_url ?? item.image_url,
      }),
    ],
  });
}

async function handleEquipar(ix: ChatInputCommandInteraction) {
  const slot = ix.options.getString("slot", true) as "banner" | "frame" | "effect";
  const slug = ix.options.getString("item", true);
  const inv = await getUserInventory(ix.user.id);
  // @ts-expect-error supabase join shape
  const owned = inv.find((x) => x.profile_cosmetics?.slug === slug);
  if (!owned) {
    return ix.reply({
      embeds: [brandEmbed({ kind: "error", title: "Item não está no seu inventário", description: `Compre em \`/perfil loja\` primeiro.` })],
      ephemeral: true,
    });
  }

  const field = `${slot}_id`;
  const ok = await saveUserLoadout(ix.user.id, { [field]: owned.cosmetic_id } as never);
  if (!ok) {
    return ix.reply({ embeds: [brandEmbed({ kind: "error", title: "Não consegui equipar", description: Msg.oops() })], ephemeral: true });
  }
  return ix.reply({
    embeds: [brandEmbed({ kind: "success", title: "Equipado!", description: `\`${slug}\` no slot **${slot}**.` })],
    ephemeral: true,
  });
}

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
        .setDescription("Mostra o perfil de alguém.")
        .addUserOption((o) => o.setName("usuario").setDescription("Quem você quer ver").setRequired(false)),
    )
    .addSubcommand((s) =>
      s
        .setName("loja")
        .setDescription("Vê os cosméticos disponíveis na loja.")
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
        .setName("comprar")
        .setDescription("Compra um cosmético pelo slug.")
        .addStringOption((o) => o.setName("item").setDescription("Slug do cosmético").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("equipar")
        .setDescription("Equipa um cosmético do seu inventário.")
        .addStringOption((o) =>
          o
            .setName("slot")
            .setDescription("Onde equipar")
            .setRequired(true)
            .addChoices(
              { name: "Banner", value: "banner" },
              { name: "Moldura", value: "frame" },
              { name: "Efeito", value: "effect" },
            ),
        )
        .addStringOption((o) => o.setName("item").setDescription("Slug do cosmético").setRequired(true)),
    ),
  async execute(ix) {
    const sub = ix.options.getSubcommand();
    if (sub === "ver") {
      const target = ix.options.getUser("usuario") ?? ix.user;
      return handleVer(ix, target.id);
    }
    if (sub === "loja") return handleLoja(ix);
    if (sub === "comprar") return handleComprar(ix);
    if (sub === "equipar") return handleEquipar(ix);
  },
};

export default command;
