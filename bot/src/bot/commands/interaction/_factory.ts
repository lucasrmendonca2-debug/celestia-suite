import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";
import { getAsset, type AssetKey } from "../../systems/ui/embed.assets.js";
import {
  classifyTarget,
  fmt,
  interactionResponses,
  pick,
} from "../../systems/personality/index.js";

type Action = keyof typeof interactionResponses;

const GIFS: Record<Action, string[]> = {
  hug: [
    "https://media.tenor.com/qOpyt8XSCb8AAAAC/hug.gif",
    "https://media.tenor.com/1zi8Z2g0Hf4AAAAC/anime-hug.gif",
    "https://media.tenor.com/kBT7TaMnVqQAAAAC/hug.gif",
  ],
  kiss: [
    "https://media.tenor.com/JTRZGYsQrhUAAAAC/anime-kiss.gif",
    "https://media.tenor.com/k02-XHnaUmsAAAAC/anime-kiss.gif",
  ],
  slap: [
    "https://media.tenor.com/Ws6Dm1ZW_vMAAAAC/anime-slap.gif",
    "https://media.tenor.com/UNGCRcwMnTYAAAAC/anime-slap.gif",
  ],
  pat: [
    "https://media.tenor.com/E2Aa2vBcjlUAAAAC/anime-pat.gif",
    "https://media.tenor.com/N0Z0YwQZQ7sAAAAC/pat-head.gif",
  ],
  bonk: [
    "https://media.tenor.com/0iAnDOzNFv8AAAAC/anime-bonk.gif",
    "https://media.tenor.com/RXVf7B96fOcAAAAC/bonk.gif",
  ],
  cuddle: ["https://media.tenor.com/_LRGgN3VWlUAAAAC/cuddle-anime.gif"],
  poke: ["https://media.tenor.com/qNl11SO3z18AAAAC/anime-poke.gif"],
};

const ASSET_KEYS: Record<Action, AssetKey> = {
  hug: "fun.hug_gif",
  kiss: "fun.kiss_gif",
  slap: "fun.slap_gif",
  pat: "fun.pat_gif",
  bonk: "fun.bonk_gif",
  cuddle: "fun.cuddle_gif",
  poke: "fun.poke_gif",
};

function build(action: Action, desc: string): SlashCommand {
  return {
    category: "interaction",
    cooldown: 3,
    guildOnly: true,
    data: new SlashCommandBuilder()
      .setName(action)
      .setDescription(desc)
      .addUserOption((o) => o.setName("usuario").setDescription("Alvo").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const guildId = interaction.guildId ?? undefined;
      const target = interaction.options.getUser("usuario", true);
      const pool = interactionResponses[action];
      const kind = classifyTarget(interaction, target);

      if (kind === "self") {
        await interaction.reply({ embeds: [ui.fun({ description: pick(pool.self), guildId })], ephemeral: true });
        return;
      }
      if (kind === "bot_self") {
        await interaction.reply({ embeds: [ui.fun({ description: pick(pool.bot), guildId })] });
        return;
      }
      if (kind === "bot_other") {
        await interaction.reply({ embeds: [ui.fun({ description: pick(pool.otherBot), guildId })] });
        return;
      }

      // Asset customizado (guild ou global) → fallback para GIF Tenor.
      const customGif = guildId ? await getAsset(guildId, ASSET_KEYS[action]) : undefined;
      const fallback = GIFS[action] ?? [];
      const image = customGif ?? fallback[Math.floor(Math.random() * fallback.length)];

      const description = fmt(pick(pool.normal), {
        author: `<@${interaction.user.id}>`,
        target: `<@${target.id}>`,
      });
      await interaction.reply({ embeds: [ui.fun({ description, image, guildId })] });
    },
  };
}

export const HUG = build("hug", "Dá um abraço em alguém.");
export const KISS = build("kiss", "Dá um beijo em alguém.");
export const SLAP = build("slap", "Dá um tapa em alguém.");
export const PAT = build("pat", "Faz carinho em alguém.");
export const BONK = build("bonk", "Bonk em alguém.");
export const CUDDLE = build("cuddle", "Faz chamego em alguém.");
export const POKE = build("poke", "Cutuca alguém.");

// Sem default export de propósito — este arquivo é só uma fábrica usada
// pelos comandos irmãos. O loader deve ignorar arquivos prefixados com "_".
export default null;
