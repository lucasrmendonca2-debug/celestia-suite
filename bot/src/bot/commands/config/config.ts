import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { prisma } from "../../../database/client.js";

const command: SlashCommand = {
  category: "config",
  cooldown: 3,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configurações do bot neste servidor.")
    .addSubcommandGroup((g) =>
      g
        .setName("logs")
        .setDescription("Canais de log")
        .addSubcommand((s) =>
          s
            .setName("set")
            .setDescription("Define um canal de log")
            .addStringOption((o) =>
              o
                .setName("tipo")
                .setDescription("Tipo de log")
                .setRequired(true)
                .addChoices(
                  { name: "Moderação", value: "modLogChannelId" },
                  { name: "Mensagens", value: "messageLogChannelId" },
                  { name: "Membros", value: "memberLogChannelId" },
                  { name: "Tickets", value: "ticketLogChannelId" },
                ),
            )
            .addChannelOption((o) =>
              o.setName("canal").setDescription("Canal de texto").addChannelTypes(ChannelType.GuildText).setRequired(true),
            ),
        ),
    )
    .addSubcommandGroup((g) =>
      g
        .setName("welcome")
        .setDescription("Boas-vindas")
        .addSubcommand((s) =>
          s
            .setName("set")
            .setDescription("Configura a mensagem de boas-vindas")
            .addChannelOption((o) =>
              o.setName("canal").setDescription("Canal").addChannelTypes(ChannelType.GuildText).setRequired(true),
            )
            .addStringOption((o) => o.setName("mensagem").setDescription("Use {user}, {server}, {memberCount}")),
        )
        .addSubcommand((s) =>
          s.setName("toggle").setDescription("Ativa/desativa boas-vindas"),
        ),
    )
    .addSubcommandGroup((g) =>
      g
        .setName("vip")
        .setDescription("VIP")
        .addSubcommand((s) =>
          s
            .setName("role")
            .setDescription("Define o cargo VIP automático")
            .addRoleOption((o) => o.setName("cargo").setDescription("Cargo VIP").setRequired(true)),
        ),
    ),
  async execute(interaction) {
    const group = interaction.options.getSubcommandGroup();
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (group === "logs" && sub === "set") {
      const tipo = interaction.options.getString("tipo", true) as
        | "modLogChannelId" | "messageLogChannelId" | "memberLogChannelId" | "ticketLogChannelId";
      const canal = interaction.options.getChannel("canal", true);
      await prisma.guildConfig.update({ where: { guildId }, data: { [tipo]: canal.id } });
      return interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "Canal de log atualizado", description: `${tipo} → <#${canal.id}>` })],
        ephemeral: true,
      });
    }

    if (group === "welcome" && sub === "set") {
      const canal = interaction.options.getChannel("canal", true);
      const msg = interaction.options.getString("mensagem") ?? undefined;
      await prisma.guildConfig.update({
        where: { guildId },
        data: { welcomeChannelId: canal.id, welcomeEnabled: true, ...(msg ? { welcomeMessage: msg } : {}) },
      });
      return interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "Boas-vindas configuradas", description: `Canal: <#${canal.id}>` })],
        ephemeral: true,
      });
    }

    if (group === "welcome" && sub === "toggle") {
      const cfg = await prisma.guildConfig.findUnique({ where: { guildId } });
      const updated = await prisma.guildConfig.update({
        where: { guildId },
        data: { welcomeEnabled: !cfg?.welcomeEnabled },
      });
      return interaction.reply({
        embeds: [brandEmbed({ kind: "info", title: `Boas-vindas ${updated.welcomeEnabled ? "ativadas" : "desativadas"}` })],
        ephemeral: true,
      });
    }

    if (group === "vip" && sub === "role") {
      const cargo = interaction.options.getRole("cargo", true);
      await prisma.guildConfig.update({ where: { guildId }, data: { vipRoleId: cargo.id } });
      return interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "Cargo VIP atualizado", description: `<@&${cargo.id}>` })],
        ephemeral: true,
      });
    }
  },
};

export default command;
