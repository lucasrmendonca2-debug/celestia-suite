import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import ms from "ms";
import type { SlashCommand } from "../../../types/command.js";
import type { VipTier } from "@prisma/client";
import { brandEmbed } from "../../utils/embed.js";
import { grantVip, revokeVip, isVip } from "../../systems/vip/vip.js";
import { prisma } from "../../../database/client.js";

const command: SlashCommand = {
  category: "vip",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("vip")
    .setDescription("Gerencia o sistema VIP do servidor.")
    .addSubcommand((s) =>
      s
        .setName("conceder")
        .setDescription("Concede VIP a um usuário (Admin).")
        .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
        .addStringOption((o) =>
          o
            .setName("tier")
            .setDescription("Tier do VIP")
            .setRequired(true)
            .addChoices(
              { name: "Bronze", value: "BRONZE" },
              { name: "Silver", value: "SILVER" },
              { name: "Gold", value: "GOLD" },
              { name: "Diamond", value: "DIAMOND" },
            ),
        )
        .addStringOption((o) => o.setName("duracao").setDescription("Ex: 30d, 90d (vazio = vitalício)")),
    )
    .addSubcommand((s) =>
      s
        .setName("remover")
        .setDescription("Remove VIP de um usuário (Admin).")
        .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("info")
        .setDescription("Mostra o status VIP de um usuário.")
        .addUserOption((o) => o.setName("usuario").setDescription("Usuário (padrão: você)")),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "info") {
      const user = interaction.options.getUser("usuario") ?? interaction.user;
      const m = await prisma.vipMembership.findUnique({
        where: { guildId_userId: { guildId: interaction.guildId!, userId: user.id } },
      });
      const active = m && (await isVip(interaction.guildId!, user.id));
      return interaction.reply({
        embeds: [
          brandEmbed({
            title: `💎 VIP — ${user.tag}`,
            description: active
              ? `Tier: **${m!.tier}**\nExpira: ${m!.expiresAt ? `<t:${Math.floor(m!.expiresAt.getTime() / 1000)}:R>` : "Vitalício"}`
              : "Sem VIP ativo.",
            thumbnail: user.displayAvatarURL(),
          }),
        ],
        ephemeral: true,
      });
    }

    // Admin
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Permissão insuficiente" })], ephemeral: true });
    }

    const user = interaction.options.getUser("usuario", true);

    if (sub === "conceder") {
      const tier = interaction.options.getString("tier", true) as VipTier;
      const dur = interaction.options.getString("duracao");
      const durationMs = dur ? (ms(dur) as number | undefined) : null;
      await grantVip({ guild: interaction.guild!, userId: user.id, tier, grantedById: interaction.user.id, durationMs });
      return interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "VIP concedido", description: `<@${user.id}> agora é **${tier}**${dur ? ` por ${dur}` : " (vitalício)"}.` })],
      });
    }

    if (sub === "remover") {
      await revokeVip(interaction.guild!, user.id, interaction.user.id);
      return interaction.reply({
        embeds: [brandEmbed({ kind: "warn", title: "VIP removido", description: `<@${user.id}> não é mais VIP.` })],
      });
    }
  },
};

export default command;
