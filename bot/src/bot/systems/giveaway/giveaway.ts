import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Client,
  type TextChannel,
  MessageFlags,
} from "discord.js";
import {
  findGiveawayById,
  updateGiveaway,
  findLevelAccount,
  findActiveUserVip,
  type GiveawayRow,
} from "../../repositories/phase4.repo.js";
import { supabase } from "../../../database/supabase.js";
import { brandEmbed } from "../../utils/embed.js";
import { fmtDuration } from "../../utils/format.js";

interface RequirementsExtras {
  requiredRoleId?: string | null;
  minLevel?: number;
  minAccountDays?: number;
  minCoins?: number;
  vipBonusEntries?: number;
}

export function giveawayEmbed(g: {
  prize: string;
  hostId: string;
  endsAt: Date;
  winnersCount: number;
  participants: string[];
  ended?: boolean;
  winners?: string[];
  requiredRoleId?: string | null;
  minLevel?: number;
  minAccountDays?: number;
  minCoins?: number;
  vipBonusEntries?: number;
}) {
  const remaining = g.endsAt.getTime() - Date.now();
  const reqs: string[] = [];
  if (g.requiredRoleId) reqs.push(`Cargo <@&${g.requiredRoleId}>`);
  if (g.minLevel) reqs.push(`Nível ≥ ${g.minLevel}`);
  if (g.minAccountDays) reqs.push(`Conta ≥ ${g.minAccountDays}d`);
  if (g.minCoins) reqs.push(`${g.minCoins} moedas`);
  if (g.vipBonusEntries) reqs.push(`VIP: +${g.vipBonusEntries} entradas`);
  const unique = new Set(g.participants).size;
  return brandEmbed({
    kind: g.ended ? "warn" : "default",
    title: `🎉 GIVEAWAY • ${g.prize}`,
    description: g.ended
      ? g.winners?.length
        ? `Encerrado! Vencedores: ${g.winners.map((w) => `<@${w}>`).join(", ")}`
        : "Encerrado sem vencedores."
      : `Clique no botão para participar!\nTermina em **${fmtDuration(Math.max(0, remaining))}** • <t:${Math.floor(
          g.endsAt.getTime() / 1000,
        )}:R>`,
    fields: [
      { name: "Vencedores", value: String(g.winnersCount), inline: true },
      { name: "Participantes", value: String(unique), inline: true },
      { name: "Host", value: `<@${g.hostId}>`, inline: true },
      ...(reqs.length ? [{ name: "Requisitos", value: reqs.join(" • ") }] : []),
    ],
  });
}

export function giveawayRow(giveawayId: string, disabled = false) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`giveaway:join:${giveawayId}`)
      .setLabel("Participar 🎉")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
  );
}

function rowToView(g: GiveawayRow) {
  const reqs = (g.requirements ?? {}) as RequirementsExtras;
  return {
    prize: g.prize,
    hostId: g.host_id,
    endsAt: new Date(g.ends_at),
    winnersCount: g.winners_count,
    participants: g.participants ?? [],
    winners: g.winners ?? [],
    ended: g.ended,
    requiredRoleId: reqs.requiredRoleId ?? null,
    minLevel: reqs.minLevel ?? 0,
    minAccountDays: reqs.minAccountDays ?? 0,
    minCoins: reqs.minCoins ?? 0,
    vipBonusEntries: reqs.vipBonusEntries ?? 0,
  };
}

export async function handleGiveawayButton(interaction: ButtonInteraction) {
  const [, action, id] = interaction.customId.split(":");
  if (action !== "join" || !id) return;
  const g = await findGiveawayById(id);
  if (!g || g.ended) {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "warn", title: "Encerrado", description: "Este giveaway já terminou." })],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const reqs = (g.requirements ?? {}) as RequirementsExtras;
  const fails: string[] = [];
  if (reqs.requiredRoleId && interaction.member && "roles" in interaction.member) {
    const roles = interaction.member.roles as { cache: Map<string, unknown> } | string[];
    const has =
      Array.isArray(roles) ? roles.includes(reqs.requiredRoleId) : roles.cache.has(reqs.requiredRoleId);
    if (!has) fails.push(`Cargo obrigatório: <@&${reqs.requiredRoleId}>`);
  }
  if (reqs.minAccountDays && reqs.minAccountDays > 0) {
    const ageDays = (Date.now() - interaction.user.createdTimestamp) / 86_400_000;
    if (ageDays < reqs.minAccountDays) fails.push(`Conta com pelo menos **${reqs.minAccountDays}d** de idade`);
  }
  if (reqs.minLevel && reqs.minLevel > 0) {
    const lvl = await findLevelAccount(g.guild_id, interaction.user.id);
    if (!lvl || (lvl.level ?? 0) < reqs.minLevel) fails.push(`Nível mínimo **${reqs.minLevel}**`);
  }
  if (reqs.minCoins && reqs.minCoins > 0) {
    const { data: eco } = await supabase
      .from("user_economy")
      .select("balance")
      .eq("guild_id", g.guild_id)
      .eq("user_id", interaction.user.id)
      .maybeSingle();
    const bal = (eco?.balance as number | undefined) ?? 0;
    if (bal < reqs.minCoins) fails.push(`Mínimo de **${reqs.minCoins}** moedas`);
  }
  if (fails.length > 0) {
    await interaction.reply({
      embeds: [
        brandEmbed({
          kind: "error",
          title: "Você não cumpre os requisitos",
          description: fails.map((f) => `• ${f}`).join("\n"),
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const participants = [...(g.participants ?? [])];
  if (participants.includes(interaction.user.id)) {
    const next = participants.filter((p) => p !== interaction.user.id);
    await updateGiveaway(g.id, { participants: next });
    g.participants = next;
    await interaction.reply({
      embeds: [brandEmbed({ kind: "info", title: "Saiu do giveaway", description: "Você não participa mais." })],
      flags: MessageFlags.Ephemeral,
    });
  } else {
    let entries = 1;
    if (reqs.vipBonusEntries && reqs.vipBonusEntries > 0) {
      const vip = await findActiveUserVip(g.guild_id, interaction.user.id);
      if (vip) entries += reqs.vipBonusEntries;
    }
    for (let i = 0; i < entries; i++) participants.push(interaction.user.id);
    await updateGiveaway(g.id, { participants });
    g.participants = participants;
    await interaction.reply({
      embeds: [
        brandEmbed({
          kind: "success",
          title: "Entrou no giveaway!",
          description: entries > 1 ? `Boa sorte 🍀 (entradas: **${entries}** — bônus VIP)` : "Boa sorte 🍀",
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }

  if (g.message_id) {
    const channel = interaction.guild?.channels.cache.get(g.channel_id) as TextChannel | undefined;
    const msg = await channel?.messages.fetch(g.message_id).catch(() => null);
    await msg
      ?.edit({ embeds: [giveawayEmbed(rowToView(g))], components: [giveawayRow(g.id)] })
      .catch(() => {});
  }
}

export async function endGiveaway(client: Client, giveawayId: string) {
  const g = await findGiveawayById(giveawayId);
  if (!g || g.ended) return;
  const pool = [...(g.participants ?? [])];
  const winners: string[] = [];
  while (winners.length < g.winners_count && pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    const pick = pool.splice(idx, 1)[0]!;
    if (winners.includes(pick)) continue;
    winners.push(pick);
  }
  await updateGiveaway(giveawayId, {
    ended: true,
    ended_at: new Date().toISOString(),
    winners,
  });
  g.ended = true;
  g.winners = winners;

  const guild = client.guilds.cache.get(g.guild_id);
  const channel = guild?.channels.cache.get(g.channel_id) as TextChannel | undefined;
  if (!channel) return;
  const msg = g.message_id ? await channel.messages.fetch(g.message_id).catch(() => null) : null;
  await msg
    ?.edit({ embeds: [giveawayEmbed(rowToView(g))], components: [giveawayRow(g.id, true)] })
    .catch(() => {});
  await channel
    .send({
      content: winners.length
        ? `🎉 Parabéns ${winners.map((w) => `<@${w}>`).join(", ")}! Vocês ganharam **${g.prize}**.`
        : `Nenhum participante no giveaway de **${g.prize}**.`,
    })
    .catch(() => {});
}
