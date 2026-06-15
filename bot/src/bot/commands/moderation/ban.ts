import { SlashCommandBuilder, GuildMember, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { logModeration, parseDuration, recordPunishment } from "../../systems/moderation/punish.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.BanMembers],
  botPermissions: [PermissionFlagsBits.BanMembers],
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bane um usuário do servidor (permanente ou temporário).")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário a ser banido").setRequired(true))
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo do banimento"))
    .addStringOption((o) => o.setName("duracao").setDescription("Ex: 7d, 24h, 30m (opcional = permanente)"))
    .addIntegerOption((o) =>
      o.setName("apagar_dias").setDescription("Apagar mensagens dos últimos N dias (0-7)").setMinValue(0).setMaxValue(7),
    ),
  async execute(interaction) {
    const user = interaction.options.getUser("usuario", true);
    const reason = interaction.options.getString("motivo") ?? undefined;
    const duration = interaction.options.getString("duracao");
    const deleteDays = interaction.options.getInteger("apagar_dias") ?? 0;
    const member = await interaction.guild!.members.fetch(user.id).catch(() => null);

    if (member && !member.bannable) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Não consigo banir", description: "Cargo acima do bot ou usuário protegido." })],
        ephemeral: true,
      });
    }

    const durationMs = parseDuration(duration);
    await interaction.deferReply();

    await interaction.guild!.bans.create(user.id, {
      reason: `[${interaction.user.tag}] ${reason ?? "Sem motivo"}`,
      deleteMessageSeconds: deleteDays * 86400,
    });

    await recordPunishment({
      guildId: interaction.guildId!,
      userId: user.id,
      moderatorId: interaction.user.id,
      type: durationMs ? "TEMPBAN" : "BAN",
      reason,
      durationMs: durationMs ?? undefined,
    });

    await logModeration(
      member ?? ({ guild: interaction.guild!, id: user.id, user: { tag: user.tag } } as unknown as GuildMember),
      durationMs ? "TEMPBAN" : "BAN",
      interaction.user.id,
      reason,
      duration ?? undefined,
    );

    await interaction.editReply({
      embeds: [
        brandEmbed({
          kind: "success",
          title: durationMs ? "Banimento temporário aplicado" : "Banimento aplicado",
          description: `<@${user.id}> foi banido.`,
          fields: [
            { name: "Motivo", value: reason ?? "—", inline: true },
            ...(duration ? [{ name: "Duração", value: duration, inline: true }] : []),
          ],
        }),
      ],
    });
  },
};

export default command;
