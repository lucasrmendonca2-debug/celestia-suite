import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import {
  listBadges,
  listUserBadges,
  awardBadge,
  revokeBadge,
  getBadgeByCode,
} from "../../systems/social/badge.service.js";

const RARITY_COLORS: Record<string, number> = {
  common: 0x9ca3af,
  uncommon: 0x22c55e,
  rare: 0x3b82f6,
  epic: 0xa855f7,
  legendary: 0xf59e0b,
  mythic: 0xef4444,
};

const command: SlashCommand = {
  category: "level",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("badges")
    .setDescription("Veja e gerencie badges do servidor.")
    .addSubcommand((s) =>
      s
        .setName("listar")
        .setDescription("Lista todas as badges do servidor."),
    )
    .addSubcommand((s) =>
      s
        .setName("minhas")
        .setDescription("Lista suas badges.")
        .addUserOption((o) => o.setName("usuario").setDescription("Ver badges de outro usuário")),
    )
    .addSubcommand((s) =>
      s
        .setName("dar")
        .setDescription("[Admin] Concede uma badge a um usuário.")
        .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
        .addStringOption((o) => o.setName("codigo").setDescription("Código da badge").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("remover")
        .setDescription("[Admin] Remove uma badge de um usuário.")
        .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
        .addStringOption((o) => o.setName("codigo").setDescription("Código da badge").setRequired(true)),
    ),

  async execute(interaction) {
    if (!interaction.inGuild()) return;
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "listar") {
      const all = await listBadges(guildId);
      const visible = all.filter((b) => !b.hidden);
      await interaction.reply({
        embeds: [
          brandEmbed({
            title: `🏅 Badges do servidor (${visible.length})`,
            description: visible.length
              ? visible
                  .map(
                    (b) =>
                      `${b.emoji} **${b.name}** \`${b.code}\` — *${b.rarity}*${b.description ? `\n   ${b.description}` : ""}`,
                  )
                  .join("\n\n")
              : "Nenhuma badge configurada ainda.",
          }),
        ],
      });
      return;
    }

    if (sub === "minhas") {
      const target = interaction.options.getUser("usuario") ?? interaction.user;
      const badges = await listUserBadges(guildId, target.id);
      await interaction.reply({
        embeds: [
          brandEmbed({
            title: `🏅 Badges de ${target.username} (${badges.length})`,
            thumbnail: target.displayAvatarURL(),
            description: badges.length
              ? badges.map((b) => `${b.emoji} **${b.name}** — *${b.rarity}*`).join("\n")
              : `${target.username} ainda não tem badges.`,
          }),
        ],
      });
      return;
    }

    // admin
    if (sub === "dar" || sub === "remover") {
      const hasPerm = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
      if (!hasPerm) {
        await interaction.reply({ ephemeral: true, content: "❌ Você precisa de `Gerenciar Servidor`." });
        return;
      }
      const target = interaction.options.getUser("usuario", true);
      const code = interaction.options.getString("codigo", true);
      const badge = await getBadgeByCode(guildId, code);
      if (!badge) {
        await interaction.reply({ ephemeral: true, content: `❌ Badge \`${code}\` não encontrada.` });
        return;
      }
      if (sub === "dar") {
        const first = await awardBadge(guildId, target.id, badge.id, interaction.user.id, "Manual via /badges dar");
        await interaction.reply({
          embeds: [
            brandEmbed({
              kind: first ? "success" : "info",
              title: first ? "✅ Badge entregue" : "ℹ️ Já possuía",
              description: `${badge.emoji} **${badge.name}** → ${target}`,
              footer: `Raridade: ${badge.rarity}`,
            }),
          ],
        });
        void RARITY_COLORS;
      } else {
        await revokeBadge(guildId, target.id, badge.id);
        await interaction.reply({
          embeds: [brandEmbed({ kind: "warn", title: "✅ Badge removida", description: `${badge.emoji} **${badge.name}** ↩ ${target}` })],
        });
      }
    }
  },
};
export default command;
