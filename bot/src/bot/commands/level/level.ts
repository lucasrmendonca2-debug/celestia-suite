import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { addXpAdmin, resetUserLevel } from "../../systems/social/xp.service.js";

const command: SlashCommand = {
  category: "level",
  cooldown: 3,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName("level")
    .setDescription("Administração do sistema de level.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s.setName("adicionar-xp")
        .setDescription("Adiciona XP a um usuário.")
        .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
        .addIntegerOption((o) => o.setName("quantidade").setDescription("XP a adicionar").setRequired(true).setMinValue(1).setMaxValue(1_000_000)),
    )
    .addSubcommand((s) =>
      s.setName("remover-xp")
        .setDescription("Remove XP de um usuário.")
        .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
        .addIntegerOption((o) => o.setName("quantidade").setDescription("XP a remover").setRequired(true).setMinValue(1).setMaxValue(1_000_000)),
    )
    .addSubcommand((s) =>
      s.setName("resetar")
        .setDescription("Reseta o level de um usuário.")
        .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true)),
    ) as SlashCommandBuilder,

  async execute(interaction) {
    if (!interaction.inGuild()) return;
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser("usuario", true);
    const member = await interaction.guild!.members.fetch(target.id).catch(() => null);
    if (!member) {
      await interaction.reply({ flags: MessageFlags.Ephemeral, content: "❌ Usuário não está no servidor." });
      return;
    }

    if (sub === "adicionar-xp") {
      const qty = interaction.options.getInteger("quantidade", true);
      const res = await addXpAdmin(interaction.guildId!, member, qty);
      await interaction.reply({
        embeds: [
          brandEmbed({
            kind: "success",
            title: "✅ XP adicionado",
            description: `${target} agora tem **${res.totalXp.toLocaleString("pt-BR")} XP** (Nível ${res.level}).`,
          }),
        ],
      });
      return;
    }
    if (sub === "remover-xp") {
      const qty = interaction.options.getInteger("quantidade", true);
      const res = await addXpAdmin(interaction.guildId!, member, -qty);
      await interaction.reply({
        embeds: [
          brandEmbed({
            kind: "warn",
            title: "✅ XP removido",
            description: `${target} agora tem **${res.totalXp.toLocaleString("pt-BR")} XP** (Nível ${res.level}).`,
          }),
        ],
      });
      return;
    }
    if (sub === "resetar") {
      await resetUserLevel(interaction.guildId!, target.id);
      await interaction.reply({
        embeds: [brandEmbed({ kind: "warn", title: "✅ Level resetado", description: `O level de ${target} foi zerado.` })],
      });
      return;
    }
  },
};
export default command;
