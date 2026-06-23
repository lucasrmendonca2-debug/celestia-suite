import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { supabase, canWriteSupabase } from "../../../database/supabase.js";
import {
  updateGuildConfig,
  updatePremiumGuildConfig,
} from "../../repositories/guildConfig.repo.js";
import { invalidateGuildConfig } from "../../utils/guildCache.js";

const LOG_FIELD_TO_COLUMN: Record<string, { table: "guild_configs" | "ticket_configs"; column: string }> = {
  modLogChannelId: { table: "guild_configs", column: "mod_log_channel_id" },
  messageLogChannelId: { table: "guild_configs", column: "message_log_channel_id" },
  memberLogChannelId: { table: "guild_configs", column: "member_log_channel_id" },
  ticketLogChannelId: { table: "ticket_configs", column: "log_channel_id" },
};

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
        .addSubcommand((s) => s.setName("toggle").setDescription("Ativa/desativa boas-vindas")),
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

    if (!canWriteSupabase) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Backend indisponível", description: "Configuração só é possível com a chave service_role configurada." })],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (group === "logs" && sub === "set") {
      const tipo = interaction.options.getString("tipo", true);
      const canal = interaction.options.getChannel("canal", true);
      const map = LOG_FIELD_TO_COLUMN[tipo];
      if (!map) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Tipo inválido" })],
          flags: MessageFlags.Ephemeral,
        });
      }
      const { error } = await supabase
        .from(map.table)
        .upsert({ guild_id: guildId, [map.column]: canal.id }, { onConflict: "guild_id" });
      if (error) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Falha ao salvar", description: error.message })],
          flags: MessageFlags.Ephemeral,
        });
      }
      invalidateGuildConfig(guildId);
      return interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "Canal de log atualizado", description: `${tipo} → <#${canal.id}>` })],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (group === "welcome" && sub === "set") {
      const canal = interaction.options.getChannel("canal", true);
      const msg = interaction.options.getString("mensagem") ?? undefined;
      await updateGuildConfig(guildId, {
        welcome_channel_id: canal.id,
        welcome_enabled: true,
        ...(msg ? { welcome_message: msg } : {}),
      });
      invalidateGuildConfig(guildId);
      return interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "Boas-vindas configuradas", description: `Canal: <#${canal.id}>` })],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (group === "welcome" && sub === "toggle") {
      const { data } = await supabase
        .from("guild_configs")
        .select("welcome_enabled")
        .eq("guild_id", guildId)
        .maybeSingle();
      const next = !(data?.welcome_enabled ?? false);
      await updateGuildConfig(guildId, { welcome_enabled: next });
      invalidateGuildConfig(guildId);
      return interaction.reply({
        embeds: [brandEmbed({ kind: "info", title: `Boas-vindas ${next ? "ativadas" : "desativadas"}` })],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (group === "vip" && sub === "role") {
      const cargo = interaction.options.getRole("cargo", true);
      await updatePremiumGuildConfig(guildId, { vip_role_id: cargo.id });
      // mantém compat com leitores que ainda consultam guild_configs.vip_role_id
      await updateGuildConfig(guildId, { vip_role_id: cargo.id });
      invalidateGuildConfig(guildId);
      return interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "Cargo VIP atualizado", description: `<@&${cargo.id}>` })],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default command;
