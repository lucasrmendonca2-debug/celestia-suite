import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Client,
  type TextChannel,
} from "discord.js";
import { Giveaway, LevelAccount, EconomyAccount, VipMembership } from "../../../database/models.js";
import { brandEmbed } from "../../utils/embed.js";
import { fmtDuration } from "../../utils/format.js";

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

export async function handleGiveawayButton(interaction: ButtonInteraction) {
  const [, action, id] = interaction.customId.split(":");
  if (action !== "join") return;
  const g = await Giveaway.findById(id);
  if (!g || g.ended) {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "warn", title: "Encerrado", description: "Este giveaway já terminou." })],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  // Verifica requisitos avançados
  const fails: string[] = [];
  if (g.requiredRoleId && interaction.member && "roles" in interaction.member) {
    const roles = interaction.member.roles as { cache: Map<string, unknown> } | string[];
    const has =
      Array.isArray(roles) ? roles.includes(g.requiredRoleId) : roles.cache.has(g.requiredRoleId);
    if (!has) fails.push(`Cargo obrigatório: <@&${g.requiredRoleId}>`);
  }
  if (g.minAccountDays && g.minAccountDays > 0) {
    const ageDays = (Date.now() - interaction.user.createdTimestamp) / 86_400_000;
    if (ageDays < g.minAccountDays) fails.push(`Conta com pelo menos **${g.minAccountDays}d** de idade`);
  }
  if (g.minLevel && g.minLevel > 0) {
    const lvl = await LevelAccount.findOne({ guildId: g.guildId, userId: interaction.user.id }).select("level");
    if (!lvl || (lvl.level ?? 0) < g.minLevel) fails.push(`Nível mínimo **${g.minLevel}**`);
  }
  if (g.minCoins && g.minCoins > 0) {
    const eco = await EconomyAccount.findOne({ guildId: g.guildId, userId: interaction.user.id }).select("balance");
    const bal = (eco as { balance?: number } | null)?.balance ?? 0;
    if (bal < g.minCoins) fails.push(`Mínimo de **${g.minCoins}** moedas`);
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

  if (g.participants.includes(interaction.user.id)) {
    g.participants = g.participants.filter((p) => p !== interaction.user.id);
    await g.save();
    await interaction.reply({
      embeds: [brandEmbed({ kind: "info", title: "Saiu do giveaway", description: "Você não participa mais." })],
      flags: MessageFlags.Ephemeral,
    });
  } else {
    let entries = 1;
    if (g.vipBonusEntries && g.vipBonusEntries > 0) {
      const vip = await VipMembership.findOne({
        guildId: g.guildId,
        userId: interaction.user.id,
        active: true,
      });
      if (vip) entries += g.vipBonusEntries;
    }
    for (let i = 0; i < entries; i++) g.participants.push(interaction.user.id);
    await g.save();
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

  // atualiza embed
  if (g.messageId) {
    const channel = interaction.guild?.channels.cache.get(g.channelId) as TextChannel | undefined;
    const msg = await channel?.messages.fetch(g.messageId).catch(() => null);
    await msg
      ?.edit({ embeds: [giveawayEmbed(g.toObject())], components: [giveawayRow(String(g._id))] })
      .catch(() => {});
  }
}

export async function endGiveaway(client: Client, giveawayId: string) {
  const g = await Giveaway.findById(giveawayId);
  if (!g || g.ended) return;
  g.ended = true;
  const pool = [...g.participants];
  const winners: string[] = [];
  while (winners.length < g.winnersCount && pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    const pick = pool.splice(idx, 1)[0]!;
    if (winners.includes(pick)) continue; // dedupe (entradas extras VIP)
    winners.push(pick);
  }
  g.winners = winners;
  await g.save();

  const guild = client.guilds.cache.get(g.guildId);
  const channel = guild?.channels.cache.get(g.channelId) as TextChannel | undefined;
  if (!channel) return;
  const msg = g.messageId ? await channel.messages.fetch(g.messageId).catch(() => null) : null;
  await msg
    ?.edit({ embeds: [giveawayEmbed(g.toObject())], components: [giveawayRow(String(g._id), true)] })
    .catch(() => {});
  await channel
    .send({
      content: winners.length ? `🎉 Parabéns ${winners.map((w) => `<@${w}>`).join(", ")}! Vocês ganharam **${g.prize}**.` : `Nenhum participante no giveaway de **${g.prize}**.`,
    })
    .catch(() => {});
}
