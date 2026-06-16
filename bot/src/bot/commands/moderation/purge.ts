import { SlashCommandBuilder, ChannelType, type TextChannel, type Message } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { hasModCapability } from "../../systems/moderation/moderation.permissions.js";
import { getModerationConfig, logModerationEvent } from "../../systems/moderation/moderation.service.js";
import { postModerationLog } from "../../systems/moderation/moderation.logger.js";
import { createCase } from "../../systems/moderation/cases.service.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Limpa mensagens com filtros avançados.")
    .addIntegerOption((o) =>
      o.setName("quantidade").setDescription("1-100").setRequired(true).setMinValue(1).setMaxValue(100),
    )
    .addUserOption((o) => o.setName("usuario").setDescription("Filtrar por usuário"))
    .addStringOption((o) => o.setName("contem").setDescription("Filtrar por texto contido"))
    .addBooleanOption((o) => o.setName("somente_bots").setDescription("Apenas bots")),
  async execute(interaction) {
    const guild = interaction.guild!;
    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_clear_messages"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para limpar mensagens." })],
        ephemeral: true,
      });
    }
    const channel = interaction.channel as TextChannel;
    if (channel.type !== ChannelType.GuildText) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Use em canal de texto." })],
        ephemeral: true,
      });
    }
    await interaction.deferReply({ ephemeral: true });
    const amount = interaction.options.getInteger("quantidade", true);
    const user = interaction.options.getUser("usuario");
    const contem = interaction.options.getString("contem")?.toLowerCase();
    const onlyBots = interaction.options.getBoolean("somente_bots") ?? false;

    const messages = await channel.messages.fetch({ limit: 100 });
    const filtered: Message[] = [];
    for (const m of messages.values()) {
      if (user && m.author.id !== user.id) continue;
      if (onlyBots && !m.author.bot) continue;
      if (contem && !m.content.toLowerCase().includes(contem)) continue;
      filtered.push(m);
      if (filtered.length >= amount) break;
    }
    const deleted = await channel.bulkDelete(filtered, true);

    const config = await getModerationConfig(guild.id);
    const c = await createCase({
      guildId: guild.id,
      userId: user?.id ?? channel.id,
      userTag: user?.tag ?? `#${channel.name}`,
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      action: "PURGE",
      reason: `${deleted.size} msgs em #${channel.name}${contem ? ` (contendo "${contem}")` : ""}${onlyBots ? " — somente bots" : ""}`,
      source: "BOT",
    });
    await logModerationEvent({
      guildId: guild.id,
      moderatorId: interaction.user.id,
      action: "PURGE",
      details: { channelId: channel.id, count: deleted.size, targetUserId: user?.id ?? null, caseNumber: c.case_number },
    });
    await postModerationLog({
      guild,
      type: "CLEAR",
      target: user ?? { id: channel.id, tag: `#${channel.name}` },
      moderator: interaction.user,
      reason: `${deleted.size} mensagens em <#${channel.id}>`,
      config,
      caseNumber: c.case_number,
    });

    await interaction.editReply({
      embeds: [
        brandEmbed({
          kind: "success",
          title: `Purge · Caso #${c.case_number}`,
          description: `Removidas **${deleted.size}** mensagens.`,
        }),
      ],
    });
  },
};

export default command;
