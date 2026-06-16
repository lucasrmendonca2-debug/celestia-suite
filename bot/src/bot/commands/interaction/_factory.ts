import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
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
      const target = interaction.options.getUser("usuario", true);
      const pool = interactionResponses[action];
      const kind = classifyTarget(interaction, target);

      // Casos especiais — sem gif, ephemeral pra não poluir o chat
      if (kind === "self") {
        await interaction.reply({
          embeds: [brandEmbed({ description: pick(pool.self) })],
          ephemeral: true,
        });
        return;
      }
      if (kind === "bot_self") {
        await interaction.reply({ embeds: [brandEmbed({ description: pick(pool.bot) })] });
        return;
      }
      if (kind === "bot_other") {
        await interaction.reply({
          embeds: [brandEmbed({ description: pick(pool.otherBot) })],
        });
        return;
      }

      // Interação normal
      const gifs = GIFS[action] ?? [];
      const gif = gifs[Math.floor(Math.random() * gifs.length)];
      const description = fmt(pick(pool.normal), {
        author: `<@${interaction.user.id}>`,
        target: `<@${target.id}>`,
      });
      await interaction.reply({ embeds: [brandEmbed({ description, image: gif })] });
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
