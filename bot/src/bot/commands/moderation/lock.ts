import { SlashCommandBuilder, type TextChannel, MessageFlags } from "discord.js";
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
    .setName("lock")
    .setDescription("Tranca o canal atual (impede @everyone de enviar mensagens)."),
  async execute(interaction) {
    const guild = interaction.guild!;
    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_lock_channel"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para trancar canais." })],
        flags: MessageFlags.Ephemeral,
      });
    }
    const channel = interaction.channel as TextChannel;
    await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });

    const config = await getModerationConfig(guild.id);
    await logModerationEvent({
      guildId: guild.id,
      moderatorId: interaction.user.id,
      action: "LOCK",
      details: { channelId: channel.id },
    });
    await postModerationLog({
      guild,
      type: "LOCK",
      target: { id: channel.id, tag: `#${channel.name}` },
      moderator: interaction.user,
      reason: `Canal <#${channel.id}> trancado`,
      config,
    });
    await interaction.reply({ embeds: [brandEmbed({ kind: "warn", title: "🔒 Canal trancado" })] });
  },
};

export default command;
