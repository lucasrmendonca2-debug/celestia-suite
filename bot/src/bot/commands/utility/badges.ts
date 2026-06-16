import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import {
  listBadges,
  listUserBadges,
  getBadgeByCode,
  awardBadge,
  revokeBadge,
} from "../../systems/social/badge.service.js";

const RARITY_EMOJI: Record<string, string> = {
  common: "⚪",
  uncommon: "🟢",
  rare: "🔵",
  epic: "🟣",
  legendary: "🟡",
  mythic: "🔴",
};

const command: SlashCommand = {
  category: "utility",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("badges")
    .setDescription("Badges/conquistas do servidor.")
    .addSubcommand((s) =>
      s
        .setName("listar")
        .setDescription("Lista todas as badges disponíveis no servidor."),
    )
    .addSubcommand((s) =>
      s
        .setName("minhas")
        .setDescription("Mostra suas badges (ou de outro usuário).")
        .addUserOption((o) => o.setName("usuario").setDescription("Usuário")),
    )
    .addSubcommand((s) =>
      s
        .setName("dar")
        .setDescription("Concede uma badge a um usuário (staff).")
        .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
        .addStringOption((o) => o.setName("codigo").setDescription("Código da badge").setRequired(true))
        .addStringOption((o) => o.setName("motivo").setDescription("Motivo").setMaxLength(200)),
    )
    .addSubcommand((s) =>
      s
        .setName("remover")
        .setDescription("Remove uma badge de um usuário (staff).")
        .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
        .addStringOption((o) => o.setName("codigo").setDescription("Código da badge").setRequired(true)),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "listar") {
      const all = (await listBadges(guildId)).filter((b) => !b.hidden);
      if (!all.length) {
        return void interaction.reply({ content: "Nenhuma badge configurada.", ephemeral: true });
      }
      const lines = all
        .map(
          (b) =>
            `${b.emoji} ${RARITY_EMOJI[b.rarity] ?? ""} **${b.name}** \`${b.code}\`\n_${b.description || "—"}_`,
        )
        .join("\n\n");
      await interaction.reply({
        embeds: [brandEmbed({ title: "🏅 Badges do servidor", description: lines })],
      });
      return;
    }

    if (sub === "minhas") {
      const target = interaction.options.getUser("usuario") ?? interaction.user;
      const owned = await listUserBadges(guildId, target.id);
      if (!owned.length) {
        return void interaction.reply({
          content: `${target.id === interaction.user.id ? "Você" : target.username} ainda não tem badges.`,
          ephemeral: true,
        });
      }
      const lines = owned
        .map((b) => `${b.emoji} **${b.name}** \`${b.code}\` ${RARITY_EMOJI[b.rarity] ?? ""}`)
        .join("\n");
      await interaction.reply({
        embeds: [
          brandEmbed({
            title: `🏅 Badges de ${target.username}`,
            description: lines,
            thumbnail: target.displayAvatarURL(),
          }),
        ],
      });
      return;
    }

    // Staff only
    const member = interaction.member;
    const isStaff =
      member &&
      typeof member.permissions !== "string" &&
      member.permissions.has(PermissionFlagsBits.ManageGuild);
    if (!isStaff) {
      return void interaction.reply({
        content: "Você precisa de **Gerenciar Servidor** para usar isso.",
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("usuario", true);
    const code = interaction.options.getString("codigo", true);
    const badge = await getBadgeByCode(guildId, code);
    if (!badge) {
      return void interaction.reply({ content: `Badge \`${code}\` não encontrada.`, ephemeral: true });
    }

    if (sub === "dar") {
      const motivo = interaction.options.getString("motivo");
      const first = await awardBadge(guildId, user.id, badge.id, interaction.user.id, motivo);
      await interaction.reply({
        content: first
          ? `✅ ${badge.emoji} **${badge.name}** concedida a <@${user.id}>.`
          : `<@${user.id}> já possui essa badge.`,
        ephemeral: !first,
      });
      return;
    }

    if (sub === "remover") {
      await revokeBadge(guildId, user.id, badge.id);
      await interaction.reply({
        content: `🗑️ ${badge.emoji} **${badge.name}** removida de <@${user.id}>.`,
        ephemeral: true,
      });
      return;
    }
  },
};

export default command;
