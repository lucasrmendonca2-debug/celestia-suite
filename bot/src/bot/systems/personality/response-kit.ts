import type { ChatInputCommandInteraction, EmbedBuilder, InteractionReplyOptions } from "discord.js";
import { brandEmbed } from "../../utils/embed.js";
import { pick } from "./random-responses.js";

/**
 * Helpers padronizados para respostas. Mantém o tom consistente e evita
 * espalhar frases soltas pelos comandos.
 */

export function funEmbed(description: string, opts?: { title?: string; image?: string }): EmbedBuilder {
  return brandEmbed({ kind: "default", title: opts?.title, description, image: opts?.image });
}

export function errorEmbed(title: string, description?: string): EmbedBuilder {
  return brandEmbed({ kind: "error", title, description });
}

export function warnEmbed(title: string, description?: string): EmbedBuilder {
  return brandEmbed({ kind: "warn", title, description });
}

export function successEmbed(title: string, description?: string): EmbedBuilder {
  return brandEmbed({ kind: "success", title, description });
}

export function infoEmbed(title: string, description?: string): EmbedBuilder {
  return brandEmbed({ kind: "info", title, description });
}

/** Resposta ephemeral pegando uma frase aleatória de um pool. */
export async function replyPick(
  interaction: ChatInputCommandInteraction,
  pool: readonly string[],
  opts: { kind?: "info" | "warn" | "error" | "success"; title?: string; ephemeral?: boolean } = {},
): Promise<void> {
  const description = pick(pool);
  const embed = brandEmbed({ kind: opts.kind ?? "info", title: opts.title, description });
  const payload: InteractionReplyOptions = {
    embeds: [embed],
    ephemeral: opts.ephemeral ?? true,
  };
  if (interaction.deferred || interaction.replied) {
    await interaction.followUp(payload);
  } else {
    await interaction.reply(payload);
  }
}
