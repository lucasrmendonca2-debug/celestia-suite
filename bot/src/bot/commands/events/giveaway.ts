import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, type TextChannel } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { Giveaway } from "../../../database/models.js";
import { parseDuration } from "../../utils/format.js";
import { giveawayEmbed, giveawayRow, endGiveaway } from "../../systems/giveaway/giveaway.js";

const command: SlashCommand = {
  category: "events",
  cooldown: 3,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName("sorteio").setNameLocalizations({"en-US":"giveaway"})
    .setDescription("Sistema de sorteios.")
    .addSubcommand((s) =>
      s
        .setName("start")
        .setDescription("Inicia um giveaway")
        .addStringOption((o) => o.setName("premio").setDescription("Prêmio").setRequired(true))
        .addStringOption((o) => o.setName("duracao").setDescription("Ex: 1h, 30m, 2d").setRequired(true))
        .addIntegerOption((o) => o.setName("vencedores").setDescription("Qtd").setMinValue(1).setMaxValue(20))
        .addChannelOption((o) => o.setName("canal").setDescription("Canal").addChannelTypes(ChannelType.GuildText))
        .addRoleOption((o) => o.setName("cargo_requerido").setDescription("Cargo obrigatório"))
        .addIntegerOption((o) => o.setName("nivel_min").setDescription("Nível mínimo").setMinValue(0))
        .addIntegerOption((o) => o.setName("conta_dias").setDescription("Idade mínima da conta em dias").setMinValue(0))
        .addIntegerOption((o) => o.setName("moedas_min").setDescription("Moedas mínimas").setMinValue(0))
        .addIntegerOption((o) => o.setName("vip_bonus").setDescription("Entradas extras para VIP").setMinValue(0).setMaxValue(10)),
    )
    .addSubcommand((s) =>
      s.setName("end").setDescription("Encerra agora").addStringOption((o) => o.setName("id").setDescription("ID do giveaway").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("reroll").setDescription("Sorteia novos vencedores").addStringOption((o) => o.setName("id").setDescription("ID").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("list").setDescription("Lista giveaways ativos")),
  async execute(interaction, { client }) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "start") {
      const prize = interaction.options.getString("premio", true);
      const durationStr = interaction.options.getString("duracao", true);
      const ms = parseDuration(durationStr);
      if (!ms || ms < 10_000) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Duração inválida", description: "Use formatos como 10m, 1h, 2d (mínimo 10s)." })], ephemeral: true });
        return;
      }
      const winnersCount = interaction.options.getInteger("vencedores") ?? 1;
      const channel = (interaction.options.getChannel("canal") ?? interaction.channel) as TextChannel;
      const requiredRoleId = interaction.options.getRole("cargo_requerido")?.id ?? null;
      const minLevel = interaction.options.getInteger("nivel_min") ?? 0;
      const minAccountDays = interaction.options.getInteger("conta_dias") ?? 0;
      const minCoins = interaction.options.getInteger("moedas_min") ?? 0;
      const vipBonusEntries = interaction.options.getInteger("vip_bonus") ?? 0;

      const doc = await Giveaway.create({
        guildId,
        channelId: channel.id,
        hostId: interaction.user.id,
        prize,
        winnersCount,
        endsAt: new Date(Date.now() + ms),
        requiredRoleId,
        minLevel,
        minAccountDays,
        minCoins,
        vipBonusEntries,
      });
      const sent = await channel.send({
        embeds: [giveawayEmbed({ ...doc.toObject(), endsAt: doc.endsAt })],
        components: [giveawayRow(String(doc._id))],
      });
      doc.messageId = sent.id;
      await doc.save();
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "🎉 Giveaway criado", description: `Em ${channel} • ID: \`${doc._id}\`` })], ephemeral: true });
      return;
    }

    if (sub === "end") {
      const id = interaction.options.getString("id", true);
      const g = await Giveaway.findById(id);
      if (!g || g.guildId !== guildId) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Giveaway não encontrado neste servidor" })], ephemeral: true });
        return;
      }
      await endGiveaway(client, id);
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Encerrado" })], ephemeral: true });
      return;
    }

    if (sub === "reroll") {
      const id = interaction.options.getString("id", true);
      const g = await Giveaway.findById(id);
      if (!g || g.guildId !== guildId) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Giveaway não encontrado neste servidor" })], ephemeral: true });
        return;
      }
      if (!g.ended) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Giveaway não está encerrado" })], ephemeral: true });
        return;
      }
      const pool = g.participants.filter((p) => !g.winners.includes(p));
      const newWinners: string[] = [];
      while (newWinners.length < g.winnersCount && pool.length) {
        newWinners.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]!);
      }
      g.winners = newWinners;
      await g.save();
      const channel = interaction.guild?.channels.cache.get(g.channelId) as TextChannel | undefined;
      await channel?.send({
        content: newWinners.length ? `🎲 Reroll! Novos vencedores: ${newWinners.map((w) => `<@${w}>`).join(", ")} — **${g.prize}**` : "Sem candidatos para reroll.",
      });
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Reroll feito" })], ephemeral: true });
      return;
    }

    if (sub === "list") {
      const list = await Giveaway.find({ guildId, ended: false }).sort({ endsAt: 1 }).limit(10);
      await interaction.reply({
        embeds: [
          brandEmbed({
            title: "🎊 Giveaways ativos",
            description: list.length
              ? list.map((g) => `• **${g.prize}** • <#${g.channelId}> • encerra <t:${Math.floor(g.endsAt.getTime() / 1000)}:R> • ID: \`${g._id}\``).join("\n")
              : "Nenhum giveaway ativo.",
          }),
        ],
        ephemeral: true,
      });
    }
  },
};
export default command;
