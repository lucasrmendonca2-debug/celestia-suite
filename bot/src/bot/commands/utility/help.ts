import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  type APIEmbed,
} from "discord.js";
import type { SlashCommand, ZenoxClient } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { Tone } from "../../utils/messages.js";
import { findCommand, searchCommands, toMeta, type CommandMeta } from "../../systems/registry/command.registry.js";

export const HELP_CATEGORIES = [
  { key: "moderation", label: "Moderação", emoji: "🛡️", desc: "Ban, kick, mute, warns, anti-raid" },
  { key: "tickets", label: "Tickets", emoji: "🎫", desc: "Painel, atendimento, transcripts" },
  { key: "economy", label: "Economia", emoji: "💰", desc: "Saldo, daily, work, loja, ranking" },
  { key: "level", label: "Level", emoji: "📈", desc: "XP, ranking, cargos por nível" },
  { key: "fun", label: "Diversão", emoji: "🎉", desc: "Memes, dados, 8ball, coinflip" },
  { key: "interaction", label: "Interação", emoji: "💞", desc: "Hug, ship, marry, kiss" },
  { key: "events", label: "Eventos", emoji: "🎊", desc: "Giveaways e sorteios" },
  { key: "utility", label: "Utilidades", emoji: "🧰", desc: "Ping, avatar, serverinfo" },
  { key: "config", label: "Configuração", emoji: "⚙️", desc: "AutoMod, welcome, embeds, custom commands" },
  { key: "vip", label: "VIP", emoji: "💎", desc: "Benefícios premium" },
  { key: "admin", label: "Admin", emoji: "👑", desc: "Painel do dono" },
] as const;

export type HelpCategoryKey = (typeof HELP_CATEGORIES)[number]["key"];

const PER_PAGE = 6;

const command: SlashCommand = {
  category: "utility",
  module: "help",
  cooldown: 3,
  enabledByDefault: true,
  dashboardConfigurable: false,
  longDescription:
    "Central de ajuda interativa: navegue pelas categorias com o menu, busque por nome ou veja os detalhes de um comando.",
  examples: ["/help", "/help comando nome:saldo", "/help buscar termo:ticket"],
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Central de ajuda interativa do Zenox.")
    .addSubcommand((s) => s.setName("inicio").setDescription("Mostra todas as categorias."))
    .addSubcommand((s) =>
      s
        .setName("comando")
        .setDescription("Detalhes de um comando específico.")
        .addStringOption((o) =>
          o.setName("nome").setDescription("Nome do comando (ex: saldo)").setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("buscar")
        .setDescription("Busca comandos por nome, descrição ou módulo.")
        .addStringOption((o) => o.setName("termo").setDescription("Texto pra procurar").setRequired(true)),
    ),
  async execute(interaction, { client }) {
    const sub = interaction.options.getSubcommand(false) ?? "inicio";

    if (sub === "comando") {
      const name = interaction.options.getString("nome", true);
      const meta = findCommand(client, name);
      if (!meta) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Comando não encontrado", description: `Não achei \`/${name}\`. Use \`/help buscar\`.` })],
          ephemeral: true,
        });
      }
      return interaction.reply({ embeds: [renderCommandDetail(meta)], ephemeral: true });
    }

    if (sub === "buscar") {
      const term = interaction.options.getString("termo", true);
      const results = searchCommands(client, term, 12);
      return interaction.reply({ embeds: [renderSearch(term, results)], ephemeral: true });
    }

    const view = renderHome(client);
    await interaction.reply({ ...view, ephemeral: true });
  },
};

export default command;

/* ---------------- Render helpers ---------------- */

interface HelpView {
  embeds: APIEmbed[];
  components: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[];
}

function buildSelect(active?: HelpCategoryKey) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("help:select")
    .setPlaceholder("Escolha uma categoria…")
    .addOptions(
      HELP_CATEGORIES.map((c) => ({
        label: c.label,
        value: c.key,
        description: c.desc,
        emoji: c.emoji,
        default: active === c.key,
      })),
    );
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

function pageButtons(category: HelpCategoryKey, page: number, totalPages: number) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`help:nav:${category}:${Math.max(0, page - 1)}`)
      .setLabel("Anterior")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 0),
    new ButtonBuilder()
      .setCustomId("help:page")
      .setLabel(`Página ${page + 1}/${totalPages}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`help:nav:${category}:${Math.min(totalPages - 1, page + 1)}`)
      .setLabel("Próxima")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
    new ButtonBuilder()
      .setCustomId("help:home")
      .setLabel("Voltar")
      .setEmoji("🏠")
      .setStyle(ButtonStyle.Success),
  );
}

export function renderHome(client: ZenoxClient): HelpView {
  const total = client.commands.size;
  const fields = HELP_CATEGORIES.map((c) => {
    const count = client.commands.filter((cmd) => cmd.category === c.key).size;
    return {
      name: `${c.emoji} ${c.label} — ${count}`,
      value: c.desc,
      inline: true,
    };
  });

  const embed = brandEmbed({
    title: "Central de Ajuda do Zenox",
    description: [
      `Olá! Tenho **${total} comandos** prontos pra deixar seu servidor ainda melhor.`,
      "",
      "**Como usar:**",
      "• Use o menu abaixo pra abrir uma categoria.",
      "• Use os botões pra navegar entre páginas.",
      "",
      `_${Tone.tagline()}_`,
    ].join("\n"),
    fields,
  }).toJSON();

  return { embeds: [embed], components: [buildSelect()] };
}

export function renderCategory(
  client: ZenoxClient,
  category: HelpCategoryKey,
  page = 0,
): HelpView {
  const meta = HELP_CATEGORIES.find((c) => c.key === category)!;
  const all = [...client.commands.values()].filter((c) => c.category === category);
  const totalPages = Math.max(1, Math.ceil(all.length / PER_PAGE));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const slice = all.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);

  const embed = brandEmbed({
    title: `${meta.emoji} ${meta.label}`,
    description: all.length
      ? slice
          .map((c) => {
            const tags: string[] = [];
            if (c.premium) tags.push("`💎 Premium`");
            if (c.ownerOnly) tags.push("`👑 Dono`");
            if (c.cooldown) tags.push(`\`⏳ ${c.cooldown}s\``);
            const head = `**/${c.data.name}**${tags.length ? ` ${tags.join(" ")}` : ""}`;
            const desc = c.longDescription ?? c.data.description;
            return `${head}\n${desc}`;
          })
          .join("\n\n")
      : "Nenhum comando nessa categoria por enquanto. Em breve! 🚧",
    footer: `${meta.label} • página ${safePage + 1}/${totalPages} • ${all.length} comandos`,
  }).toJSON();

  return {
    embeds: [embed],
    components: [buildSelect(category), pageButtons(category, safePage, totalPages)],
  };
}

/* ---------------- Command detail / search ---------------- */

function badges(meta: CommandMeta): string {
  const tags: string[] = [];
  if (meta.premiumOnly) tags.push("`💎 Premium`");
  if (meta.premiumGuildOnly) tags.push("`🏠 Premium Server`");
  if (meta.vipOnly) tags.push("`⭐ VIP`");
  if (meta.staffOnly) tags.push("`🛡️ Staff`");
  if (meta.ownerOnly) tags.push("`👑 Dono`");
  if (meta.cooldown) tags.push(`\`⏳ ${meta.cooldown}s\``);
  if (!meta.enabledByDefault) tags.push("`⚙️ Opt-in`");
  return tags.join(" ");
}

export function renderCommandDetail(meta: CommandMeta): APIEmbed {
  const cat = HELP_CATEGORIES.find((c) => c.key === meta.category);
  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: "Categoria", value: `${cat?.emoji ?? ""} ${cat?.label ?? meta.category}`, inline: true },
    { name: "Cooldown", value: meta.cooldown ? `${meta.cooldown}s` : "—", inline: true },
    { name: "Dashboard", value: meta.dashboardConfigurable ? "Sim" : "Não", inline: true },
  ];
  if (meta.subcommands.length) {
    fields.push({ name: "Subcomandos", value: meta.subcommands.map((s) => `\`${s}\``).join(" "), inline: false });
  }
  if (meta.examples.length) {
    fields.push({ name: "Exemplos", value: meta.examples.map((e) => `\`${e}\``).join("\n"), inline: false });
  }
  return brandEmbed({
    title: `/${meta.name}`,
    description: [meta.longDescription ?? meta.description, badges(meta)].filter(Boolean).join("\n\n"),
    fields,
  }).toJSON();
}

export function renderSearch(term: string, results: CommandMeta[]): APIEmbed {
  return brandEmbed({
    title: `🔎 Resultados para "${term}"`,
    description: results.length
      ? results
          .map((m) => `**/${m.name}** — ${m.description}${badges(m) ? `\n${badges(m)}` : ""}`)
          .join("\n\n")
      : "Nada encontrado. Tente outro termo.",
    footer: `${results.length} comando(s)`,
  }).toJSON();
}
