/**
 * Sistema de enquetes (polls) — armazena no Supabase.
 * Cada poll tem perguntas e opções (até 10), botões para votar
 * e um embed que mostra os resultados.
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

export interface PollRow {
  id: string;
  guild_id: string;
  channel_id: string;
  message_id: string | null;
  question: string;
  options: string[];
  anonymous: boolean;
  multiple_choice: boolean;
  ends_at: string | null;
  status: "ACTIVE" | "ENDED" | "CANCELED";
  created_by: string;
}

const BUTTON_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export async function getPoll(id: string): Promise<PollRow | null> {
  const { data } = await supabase.from("polls").select("*").eq("id", id).maybeSingle();
  return (data as PollRow | null) ?? null;
}

export async function getVoteCounts(pollId: string, optionCount: number): Promise<number[]> {
  const { data } = await supabase.from("poll_votes").select("option_index").eq("poll_id", pollId);
  const counts = new Array(optionCount).fill(0);
  for (const row of (data ?? []) as { option_index: number }[]) {
    if (row.option_index >= 0 && row.option_index < optionCount) counts[row.option_index]++;
  }
  return counts;
}

function progressBar(pct: number): string {
  const filled = Math.round(pct * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

export async function pollEmbed(poll: PollRow): Promise<EmbedBuilder> {
  const counts = await getVoteCounts(poll.id, poll.options.length);
  const total = counts.reduce((a, b) => a + b, 0);
  const lines = poll.options.map((opt, i) => {
    const c = counts[i] ?? 0;
    const pct = total > 0 ? c / total : 0;
    return `**${BUTTON_EMOJIS[i] ?? `#${i + 1}`} ${opt}**\n\`${progressBar(pct)}\` ${c} voto(s) · ${(pct * 100).toFixed(0)}%`;
  });

  const ended = poll.status !== "ACTIVE";
  const endsAtNote = poll.ends_at
    ? ended
      ? `Encerrada <t:${Math.floor(new Date(poll.ends_at).getTime() / 1000)}:R>`
      : `Termina <t:${Math.floor(new Date(poll.ends_at).getTime() / 1000)}:R>`
    : "Sem prazo definido";

  return brandEmbed({
    kind: ended ? "warn" : "info",
    title: `📊 ${poll.question}`,
    description: lines.join("\n\n"),
    fields: [
      { name: "Total de votos", value: String(total), inline: true },
      { name: "Status", value: ended ? (poll.status === "CANCELED" ? "Cancelada" : "Encerrada") : "Em andamento", inline: true },
      { name: "Anônima", value: poll.anonymous ? "Sim" : "Não", inline: true },
      { name: "Prazo", value: endsAtNote, inline: false },
    ],
    footer: `Poll ID: ${poll.id}`,
  });
}

export function pollRows(poll: PollRow): ActionRowBuilder<ButtonBuilder>[] {
  const ended = poll.status !== "ACTIVE";
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < poll.options.length; i += 5) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    for (let j = i; j < Math.min(i + 5, poll.options.length); j++) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`poll:vote:${poll.id}:${j}`)
          .setLabel(`${j + 1}`)
          .setEmoji(BUTTON_EMOJIS[j] ?? "🔘")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(ended),
      );
    }
    rows.push(row);
  }
  return rows;
}

export async function refreshPollMessage(client: Client, poll: PollRow) {
  if (!poll.message_id) return;
  const guild = client.guilds.cache.get(poll.guild_id);
  const channel = guild?.channels.cache.get(poll.channel_id) as TextChannel | undefined;
  const msg = await channel?.messages.fetch(poll.message_id).catch(() => null);
  if (!msg) return;
  const embed = await pollEmbed(poll);
  await msg.edit({ embeds: [embed], components: pollRows(poll) }).catch(() => {});
}

export async function handlePollButton(interaction: ButtonInteraction) {
  const parts = interaction.customId.split(":");
  if (parts[1] !== "vote") return;
  const pollId = parts[2]!;
  const optionIndex = Number(parts[3]);

  const poll = await getPoll(pollId);
  if (!poll) {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "error", title: "Enquete não encontrada", description: "Essa enquete já foi removida." })],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  if (poll.status !== "ACTIVE") {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "warn", title: "Encerrada", description: "Esta enquete já foi encerrada." })],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Verifica voto existente
  const { data: existing } = await supabase
    .from("poll_votes")
    .select("id, option_index")
    .eq("poll_id", pollId)
    .eq("user_id", interaction.user.id);

  const alreadyOnThis = (existing ?? []).find((r) => r.option_index === optionIndex);

  if (alreadyOnThis) {
    // Retira voto
    await supabase.from("poll_votes").delete().eq("id", alreadyOnThis.id);
    await interaction.reply({
      embeds: [brandEmbed({ kind: "info", title: "Voto removido", description: `Você não vota mais na opção **${poll.options[optionIndex]}**.` })],
      flags: MessageFlags.Ephemeral,
    });
  } else {
    if (!poll.multiple_choice && (existing?.length ?? 0) > 0) {
      // Single-choice: remove voto anterior antes de inserir
      await supabase.from("poll_votes").delete().eq("poll_id", pollId).eq("user_id", interaction.user.id);
    }
    await supabase.from("poll_votes").insert({
      poll_id: pollId,
      guild_id: poll.guild_id,
      user_id: interaction.user.id,
      option_index: optionIndex,
    });
    await interaction.reply({
      embeds: [brandEmbed({ kind: "success", title: "Voto computado", description: `Você votou em **${poll.options[optionIndex]}**.` })],
      flags: MessageFlags.Ephemeral,
    });
  }

  await refreshPollMessage(interaction.client, poll);
}

export async function endPoll(client: Client, pollId: string): Promise<PollRow | null> {
  const { data } = await supabase
    .from("polls")
    .update({ status: "ENDED" })
    .eq("id", pollId)
    .select("*")
    .maybeSingle();
  const poll = data as PollRow | null;
  if (poll) await refreshPollMessage(client, poll);
  return poll;
}
