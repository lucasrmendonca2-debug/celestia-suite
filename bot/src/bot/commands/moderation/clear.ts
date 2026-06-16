import { SlashCommandBuilder, ChannelType, type TextChannel } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { hasModCapability } from "../../systems/moderation/moderation.permissions.js";
import { getModerationConfig, logModerationEvent } from "../../systems/moderation/moderation.service.js";
import { postModerationLog } from "../../systems/moderation/moderation.logger.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Apaga mensagens recentes do canal.")
    .addIntegerOption((o) =>
      o.setName("quantidade").setDescription("1-100").setRequired(true).setMinValue(1).setMaxValue(100),
    )
    .addUserOption((o) => o.setName("usuario").setDescription("Apenas mensagens deste usuário")),
  async execute(interaction) {
    const guild = interaction.guild!;
    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_clear_messages"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para limpar mensagens." })],
        ephemeral: true,
      });
    }
    const amount = interaction.options.getInteger("quantidade", true);
    const user = interaction.options.getUser("usuario");
    const channel = interaction.channel as TextChannel;
    if (channel.type !== ChannelType.GuildText) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Use em canal de texto." })],
        ephemeral: true,
      });
    }
    await interaction.deferReply({ ephemeral: true });
    const messages = await channel.messages.fetch({ limit: 100 });
    const target = user
      ? messages.filter((m) => m.author.id === user.id).first(amount)
      : Array.from(messages.values()).slice(0, amount);
    const deleted = await channel.bulkDelete(target, true);

    const config = await getModerationConfig(guild.id);
    await logModerationEvent({
      guildId: guild.id,
      moderatorId: interaction.user.id,
      action: "CLEAR",
      details: { channelId: channel.id, count: deleted.size, targetUserId: user?.id ?? null },
    });
    await postModerationLog({
      guild,
      type: "CLEAR",
      target: user ?? { id: channel.id, tag: `#${channel.name}` },
      moderator: interaction.user,
      reason: `${deleted.size} mensagens em <#${channel.id}>`,
      config,
    });

    await interaction.editReply({
      embeds: [brandEmbed({ kind: "success", title: "Mensagens apagadas", description: `Removidas **${deleted.size}** mensagens.` })],
    });
  },
};

export default command;
