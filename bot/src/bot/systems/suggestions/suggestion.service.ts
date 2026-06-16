/**
 * Sistema de sugestões — usa Supabase para persistir.
 * Cada sugestão vira um embed no canal configurado, com botões de upvote/downvote.
 */
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Client,
  EmbedBuilder,
  type TextChannel,
} from "discord.js";
import { supabase } from "../../../database/supabase.js";
import { brandEmbed } from "../../utils/embed.js";

export type SuggestionStatus = "PENDING" | "APPROVED" | "REJECTED" | "IMPLEMENTED" | "REVIEW";

export interface SuggestionRow {
  id: string;
  guild_id: string;
  channel_id: string;
  message_id: string | null;
  author_id: string;
  content: string;
  status: SuggestionStatus;
  staff_response: string | null;
  decided_by: string | null;
  decision_reason: string | null;
  upvotes: number;
  downvotes: number;
}

const STATUS_META: Record<SuggestionStatus, { label: string; emoji: string; kind: "default" | "success" | "warn" | "error" | "info" }> = {
  PENDING: { label: "Pendente", emoji: "⏳", kind: "info" },
  REVIEW: { label: "Em análise", emoji: "🔍", kind: "info" },
  APPROVED: { label: "Aprovada", emoji: "✅", kind: "success" },
  REJECTED: { label: "Reprovada", emoji: "❌", kind: "error" },
  IMPLEMENTED: { label: "Implementada", emoji: "🚀", kind: "success" },
};

export async function getSuggestion(id: string): Promise<SuggestionRow | null> {
  const { data } = await supabase.from("suggestions").select("*").eq("id", id).maybeSingle();
  return (data as SuggestionRow | null) ?? null;
}

export function suggestionEmbed(s: SuggestionRow): EmbedBuilder {
  const meta = STATUS_META[s.status];
  return brandEmbed({
    kind: meta.kind,
    title: `${meta.emoji} Sugestão · ${meta.label}`,
    description: s.content,
    fields: [
      { name: "Autor", value: `<@${s.author_id}>`, inline: true },
      { name: "👍 / 👎", value: `${s.upvotes} / ${s.downvotes}`, inline: true },
      ...(s.staff_response ? [{ name: "Resposta da staff", value: s.staff_response }] : []),
      ...(s.decision_reason ? [{ name: "Motivo da decisão", value: s.decision_reason }] : []),
      ...(s.decided_by ? [{ name: "Decisão por", value: `<@${s.decided_by}>`, inline: true }] : []),
    ],
    footer: `ID: ${s.id}`,
  });
}

export function suggestionRows(s: SuggestionRow, votingEnabled: boolean): ActionRowBuilder<ButtonBuilder>[] {
  if (!votingEnabled || s.status === "REJECTED" || s.status === "IMPLEMENTED") return [];
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`suggestion:vote:${s.id}:UP`)
      .setLabel(`${s.upvotes}`)
      .setEmoji("👍")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`suggestion:vote:${s.id}:DOWN`)
      .setLabel(`${s.downvotes}`)
      .setEmoji("👎")
      .setStyle(ButtonStyle.Danger),
  );
  return [row];
}

export async function refreshSuggestionMessage(client: Client, s: SuggestionRow, votingEnabled: boolean) {
  if (!s.message_id) return;
  const guild = client.guilds.cache.get(s.guild_id);
  const channel = guild?.channels.cache.get(s.channel_id) as TextChannel | undefined;
  const msg = await channel?.messages.fetch(s.message_id).catch(() => null);
  if (!msg) return;
  await msg.edit({ embeds: [suggestionEmbed(s)], components: suggestionRows(s, votingEnabled) }).catch(() => {});
}

async function getCommunityConfig(guildId: string) {
  const { data } = await supabase.from("community_config").select("*").eq("guild_id", guildId).maybeSingle();
  return data ?? null;
}

async function recalcVotes(suggestionId: string) {
  const { data } = await supabase.from("suggestion_votes").select("vote_type").eq("suggestion_id", suggestionId);
  let up = 0;
  let down = 0;
  for (const r of (data ?? []) as { vote_type: string }[]) {
    if (r.vote_type === "UP") up++;
    else if (r.vote_type === "DOWN") down++;
  }
  await supabase.from("suggestions").update({ upvotes: up, downvotes: down }).eq("id", suggestionId);
  return { up, down };
}

export async function handleSuggestionButton(interaction: ButtonInteraction) {
  const parts = interaction.customId.split(":");
  if (parts[1] !== "vote") return;
  const id = parts[2]!;
  const type = parts[3] as "UP" | "DOWN";

  const s = await getSuggestion(id);
  if (!s) {
    await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Não encontrada" })], ephemeral: true });
    return;
  }

  const config = await getCommunityConfig(s.guild_id);
  const votingEnabled = config?.suggestions_allow_voting ?? true;
  if (!votingEnabled) {
    await interaction.reply({ embeds: [brandEmbed({ kind: "warn", title: "Votação desativada" })], ephemeral: true });
    return;
  }

  const { data: existing } = await supabase
    .from("suggestion_votes")
    .select("id, vote_type")
    .eq("suggestion_id", id)
    .eq("user_id", interaction.user.id)
    .maybeSingle();

  if (existing && (existing as { vote_type: string }).vote_type === type) {
    await supabase.from("suggestion_votes").delete().eq("id", (existing as { id: string }).id);
    await interaction.reply({ embeds: [brandEmbed({ kind: "info", title: "Voto removido" })], ephemeral: true });
  } else if (existing) {
    await supabase.from("suggestion_votes").update({ vote_type: type }).eq("id", (existing as { id: string }).id);
    await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Voto trocado" })], ephemeral: true });
  } else {
    await supabase.from("suggestion_votes").insert({
      suggestion_id: id,
      guild_id: s.guild_id,
      user_id: interaction.user.id,
      vote_type: type,
    });
    await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: type === "UP" ? "Votou positivo 👍" : "Votou negativo 👎" })], ephemeral: true });
  }

  await recalcVotes(id);
  const fresh = await getSuggestion(id);
  if (fresh) await refreshSuggestionMessage(interaction.client, fresh, votingEnabled);
}
