import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";

const command: SlashCommand = {
  category: "utility",
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Mostra informações de um usuário.")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário (padrão: você)")),
  async execute(interaction) {
    const user = interaction.options.getUser("usuario") ?? interaction.user;
    const member = interaction.guild ? await interaction.guild.members.fetch(user.id).catch(() => null) : null;
    const roles = member ? member.roles.cache.filter((r) => r.id !== interaction.guild!.id).map((r) => `<@&${r.id}>`).slice(0, 20).join(" ") || "Nenhum" : "—";
    await interaction.reply({
      embeds: [
        brandEmbed({
          title: user.tag,
          thumbnail: user.displayAvatarURL({ size: 256 }),
          fields: [
            { name: "ID", value: `\`${user.id}\``, inline: true },
            { name: "Conta criada", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
            ...(member?.joinedTimestamp ? [{ name: "Entrou no servidor", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true }] : []),
            { name: "Cargos", value: roles },
          ],
        }),
      ],
      ephemeral: true,
    });
  },
};

export default command;
