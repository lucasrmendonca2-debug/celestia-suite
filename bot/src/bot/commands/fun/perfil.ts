import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type AutocompleteInteraction,
  type APIEmbedField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";
import { brandEmbed } from "../../utils/embed.js";
import { Msg } from "../../utils/messages.js";
import {
  getUserInventory,
  getUserLoadout,
  saveUserLoadout,
  type CosmeticType,
} from "../../systems/cosmetics/cosmetics.service.js";
import { supabase } from "../../../database/supabase.js";

const RARITY_BADGE: Record<string, string> = {
  common: "⚪ Comum",
  rare: "🔵 Raro",
  epic: "🟣 Épico",
  legendary: "🟡 Lendário",
  seasonal: "🌟 Sazonal",
};

const SLOT_EMOJI: Record<string, string> = {
  banner: "🖼️",
  frame: "🪟",
  sticker: "🎟️",
  effect: "✨",
};

function cardSvgUrl(userId: string): string {
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://zenoxbot.lovable.app";
  return `${appUrl.replace(/\/$/, "")}/api/public/profile/${userId}/card.svg?v=${Date.now()}`;
}

function cardImageUrl(userId: string): string {
  // Discord embeds don't render SVG — proxy through wsrv.nl to convert to PNG.
  return `https://wsrv.nl/?url=${encodeURIComponent(cardSvgUrl(userId))}&output=png&n=-1`;
}

function shopUrl(): string {
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://zenoxbot.lovable.app";
  return `${appUrl.replace(/\/$/, "")}/loja`;
}

// ============= /perfil ver  &  /perfil preview =============

interface EquippedItem {
  id: string;
  slot: string;
  name: string;
  rarity: string;
}

async function loadEquippedCosmetics(loadout: Awaited<ReturnType<typeof getUserLoadout>>): Promise<EquippedItem[]> {
  if (!loadout) return [];
  const ids = [
    ...(loadout.banner_id ? [{ id: loadout.banner_id, slot: "banner" }] : []),
    ...(loadout.frame_id ? [{ id: loadout.frame_id, slot: "frame" }] : []),
    ...(loadout.effect_id ? [{ id: loadout.effect_id, slot: "effect" }] : []),
    ...(loadout.sticker_ids ?? []).map((id) => ({ id, slot: "sticker" })),
  ];
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("profile_cosmetics")
    .select("id,name,rarity")
    .in("id", ids.map((i) => i.id));
  const byId = new Map((data ?? []).map((r) => [r.id as string, r]));
  return ids
    .map(({ id, slot }) => {
      const c = byId.get(id);
      if (!c) return null;
      return { id, slot, name: c.name as string, rarity: c.rarity as string };
    })
    .filter((x): x is EquippedItem => x !== null);
}

async function handleVer(ix: ChatInputCommandInteraction, targetId: string) {
  await ix.deferReply();
  const [loadout, inventory] = await Promise.all([
    getUserLoadout(targetId),
    getUserInventory(targetId),
  ]);
  const equipped = await loadEquippedCosmetics(loadout);
  const totalItems = inventory.length;

  const fields: APIEmbedField[] = [];

  // Group equipped by slot
  const banner = equipped.find((e) => e.slot === "banner");
  const frame = equipped.find((e) => e.slot === "frame");
  const effect = equipped.find((e) => e.slot === "effect");
  const stickers = equipped.filter((e) => e.slot === "sticker");

  if (banner) fields.push({ name: `${SLOT_EMOJI.banner} Banner`, value: `${banner.name} · ${RARITY_BADGE[banner.rarity] ?? banner.rarity}`, inline: true });
  if (frame) fields.push({ name: `${SLOT_EMOJI.frame} Moldura`, value: `${frame.name} · ${RARITY_BADGE[frame.rarity] ?? frame.rarity}`, inline: true });
  if (effect) fields.push({ name: `${SLOT_EMOJI.effect} Efeito`, value: `${effect.name} · ${RARITY_BADGE[effect.rarity] ?? effect.rarity}`, inline: true });
  if (stickers.length > 0) {
    fields.push({
      name: `${SLOT_EMOJI.sticker} Stickers (${stickers.length}/3)`,
      value: stickers.map((s) => `• ${s.name} ${RARITY_BADGE[s.rarity]?.split(" ")[0] ?? ""}`).join("\n"),
      inline: false,
    });
  }

  fields.push(
    { name: "📦 Inventário", value: String(totalItems), inline: true },
    { name: "🎨 Layout", value: loadout?.card_layout ?? "classic", inline: true },
  );
  if (loadout?.accent_color) {
    fields.push({ name: "🌈 Cor", value: `\`${loadout.accent_color}\``, inline: true });
  }
  if (loadout?.bio) {
    fields.push({ name: "💬 Bio", value: loadout.bio });
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("🛒 Personalizar no site")
      .setStyle(ButtonStyle.Link)
      .setURL(shopUrl()),
  );

  return ix.editReply({
    embeds: [
      ui.social({
        title: `Perfil de ${targetId === ix.user.id ? "você" : `<@${targetId}>`}`,
        description: equipped.length > 0
          ? "Card com cosméticos equipados. Veja a loja no site pra liberar mais visuais!"
          : "Card padrão — visite a loja no site para personalizar com banners, molduras, stickers e efeitos.",
        fields,
        image: cardImageUrl(targetId),
      }),
    ],
    components: [row],
  });
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
          description: `Compre cosméticos no site: ${shopUrl()}`,
        }),
      ],
      flags: MessageFlags.Ephemeral,
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
          flags: MessageFlags.Ephemeral,
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
      flags: MessageFlags.Ephemeral,
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
    flags: MessageFlags.Ephemeral,
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
    if (sub === "equipar") return handleEquipar(ix);
  },
  async autocomplete(ix) {
    return handleAutocomplete(ix);
  },
};

export default command;
