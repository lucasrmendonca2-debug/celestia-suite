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
}) {
  const remaining = g.endsAt.getTime() - Date.now();
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
      { name: "Participantes", value: String(g.participants.length), inline: true },
      { name: "Host", value: `<@${g.hostId}>`, inline: true },
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
      ephemeral: true,
    });
    return;
  }
  if (g.requiredRoleId && interaction.member && "roles" in interaction.member) {
    const roles = interaction.member.roles as { cache: Map<string, unknown> } | string[];
    const has =
      Array.isArray(roles) ? roles.includes(g.requiredRoleId) : roles.cache.has(g.requiredRoleId);
    if (!has) {
      await interaction.reply({
        embeds: [
          brandEmbed({
            kind: "error",
            title: "Sem permissão",
            description: `Você precisa do cargo <@&${g.requiredRoleId}> para participar.`,
          }),
        ],
        ephemeral: true,
      });
      return;
    }
  }

  if (g.participants.includes(interaction.user.id)) {
    g.participants = g.participants.filter((p) => p !== interaction.user.id);
    await g.save();
    await interaction.reply({
      embeds: [brandEmbed({ kind: "info", title: "Saiu do giveaway", description: "Você não participa mais." })],
      ephemeral: true,
    });
  } else {
    g.participants.push(interaction.user.id);
    await g.save();
    await interaction.reply({
      embeds: [
        brandEmbed({ kind: "success", title: "Entrou no giveaway!", description: "Boa sorte 🍀" }),
      ],
      ephemeral: true,
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
    winners.push(pool.splice(idx, 1)[0]!);
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
