import { SlashCommandBuilder, ChannelType } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";

const command: SlashCommand = {
  category: "utility",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder().setName("serverinfo").setDescription("Informações deste servidor."),
  async execute(interaction) {
    const g = interaction.guild!;
    const channels = g.channels.cache;
    await interaction.reply({
      embeds: [
        brandEmbed({
          title: g.name,
          thumbnail: g.iconURL({ size: 256 }) ?? undefined,
          fields: [
            { name: "ID", value: `\`${g.id}\``, inline: true },
            { name: "Membros", value: String(g.memberCount), inline: true },
            { name: "Criado", value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
            { name: "Cargos", value: String(g.roles.cache.size), inline: true },
            { name: "Canais de texto", value: String(channels.filter((c) => c.type === ChannelType.GuildText).size), inline: true },
            { name: "Canais de voz", value: String(channels.filter((c) => c.type === ChannelType.GuildVoice).size), inline: true },
          ],
        }),
      ],
      ephemeral: true,
    });
  },
};

export default command;
