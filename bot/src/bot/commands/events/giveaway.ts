import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, type TextChannel, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import {
  createGiveaway,
  findGiveawayById,
  listActiveGiveaways,
  updateGiveaway,
} from "../../repositories/phase4.repo.js";
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
        .setName("iniciar")
        .setNameLocalizations({ "en-US": "start" })
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
      s.setName("encerrar").setNameLocalizations({ "en-US": "end" }).setDescription("Encerra agora").addStringOption((o) => o.setName("id").setDescription("ID do giveaway").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("reroll").setDescription("Sorteia novos vencedores").addStringOption((o) => o.setName("id").setDescription("ID").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("listar").setNameLocalizations({ "en-US": "list" }).setDescription("Lista giveaways ativos")),
  async execute(interaction, { client }) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "iniciar") {
      const prize = interaction.options.getString("premio", true);
      const durationStr = interaction.options.getString("duracao", true);
      const ms = parseDuration(durationStr);
      if (!ms || ms < 10_000) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Duração inválida", description: "Use formatos como 10m, 1h, 2d (mínimo 10s)." })], flags: MessageFlags.Ephemeral });
        return;
      }
      const winnersCount = interaction.options.getInteger("vencedores") ?? 1;
      const channel = (interaction.options.getChannel("canal") ?? interaction.channel) as TextChannel;
      const requirements = {
        requiredRoleId: interaction.options.getRole("cargo_requerido")?.id ?? null,
        minLevel: interaction.options.getInteger("nivel_min") ?? 0,
        minAccountDays: interaction.options.getInteger("conta_dias") ?? 0,
        minCoins: interaction.options.getInteger("moedas_min") ?? 0,
        vipBonusEntries: interaction.options.getInteger("vip_bonus") ?? 0,
      };

      const endsAt = new Date(Date.now() + ms);
      const doc = await createGiveaway({
        guildId,
        channelId: channel.id,
        hostId: interaction.user.id,
        prize,
        winnersCount,
        endsAt,
        requirements,
      });
      if (!doc) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Falha ao criar giveaway" })], flags: MessageFlags.Ephemeral });
        return;
      }
      const sent = await channel.send({
        embeds: [giveawayEmbed({
          prize,
          hostId: interaction.user.id,
          endsAt,
          winnersCount,
          participants: [],
          ...requirements,
        })],
        components: [giveawayRow(doc.id)],
      });
      await updateGiveaway(doc.id, { message_id: sent.id });
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "🎉 Giveaway criado", description: `Em ${channel} • ID: \`${doc.id}\`` })], flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === "encerrar") {
      const id = interaction.options.getString("id", true);
      const g = await findGiveawayById(id);
      if (!g || g.guild_id !== guildId) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Giveaway não encontrado neste servidor" })], flags: MessageFlags.Ephemeral });
        return;
      }
      await endGiveaway(client, id);
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Encerrado" })], flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === "reroll") {
      const id = interaction.options.getString("id", true);
      const g = await findGiveawayById(id);
      if (!g || g.guild_id !== guildId) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Giveaway não encontrado neste servidor" })], flags: MessageFlags.Ephemeral });
        return;
      }
      if (!g.ended) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Giveaway não está encerrado" })], flags: MessageFlags.Ephemeral });
        return;
      }
      const pool = (g.participants ?? []).filter((p) => !(g.winners ?? []).includes(p));
      const newWinners: string[] = [];
      while (newWinners.length < g.winners_count && pool.length) {
        newWinners.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]!);
      }
      await updateGiveaway(g.id, { winners: newWinners });
      const channel = interaction.guild?.channels.cache.get(g.channel_id) as TextChannel | undefined;
      await channel?.send({
        content: newWinners.length ? `🎲 Reroll! Novos vencedores: ${newWinners.map((w) => `<@${w}>`).join(", ")} — **${g.prize}**` : "Sem candidatos para reroll.",
      });
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Reroll feito" })], flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === "listar") {
      const list = await listActiveGiveaways(guildId, 10);
      await interaction.reply({
        embeds: [
          brandEmbed({
            title: "🎊 Giveaways ativos",
            description: list.length
              ? list.map((g) => `• **${g.prize}** • <#${g.channel_id}> • encerra <t:${Math.floor(new Date(g.ends_at).getTime() / 1000)}:R> • ID: \`${g.id}\``).join("\n")
              : "Nenhum giveaway ativo.",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
export default command;
