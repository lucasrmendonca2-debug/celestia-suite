import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { hasModCapability } from "../../systems/moderation/moderation.permissions.js";
import { listUserCases } from "../../systems/moderation/cases.service.js";

const ICON: Record<string, string> = {
  BAN: "🔨",
  TEMP_BAN: "⏱️",
  UNBAN: "🟢",
  KICK: "👢",
  MUTE: "🔇",
  TEMP_MUTE: "⏱️",
  UNMUTE: "🔊",
  WARN: "⚠️",
  REMOVEWARN: "✅",
  NOTE: "📝",
  CLEAR: "🧹",
  PURGE: "🧹",
  LOCK: "🔒",
  UNLOCK: "🔓",
  SLOWMODE: "🐢",
  NICKNAME: "✏️",
};

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("history")
    .setDescription("Mostra o histórico de moderação de um usuário.")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true)),
  async execute(interaction) {
    const guild = interaction.guild!;
    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_view_history"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para ver histórico." })],
        flags: MessageFlags.Ephemeral,
      });
    }
    const user = interaction.options.getUser("usuario", true);
    const cases = await listUserCases(guild.id, user.id, 25);
    const lines = cases.length
      ? cases.map(
          (c) =>
            `${ICON[c.action] ?? "•"} \`#${c.case_number}\` **${c.action}** — ${c.reason ?? "Sem motivo"} \n   <t:${Math.floor(new Date(c.created_at).getTime() / 1000)}:R> · por <@${c.moderator_id}>${c.active ? "" : " · ⚪ inativo"}`,
        )
      : ["Nenhum caso registrado."];

    await interaction.reply({
      embeds: [
        brandEmbed({
          title: `Histórico de ${user.tag}`,
          thumbnail: user.displayAvatarURL(),
          description: lines.join("\n\n").slice(0, 4000),
          footer: `${cases.length} caso(s) recentes`,
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default command;
