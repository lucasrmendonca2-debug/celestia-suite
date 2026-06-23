import { SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { supabase } from "../../../database/supabase.js";
import { getLogsConfig, invalidateLogsConfig } from "../../systems/logs/logs.config.js";

const CATEGORY_COLUMNS: Record<string, string> = {
  geral: "log_channel_id",
  mensagens: "message_channel_id",
  membros: "member_channel_id",
  cargos: "role_channel_id",
  canais: "channel_channel_id",
  voz: "voice_channel_id",
  servidor: "server_channel_id",
  moderacao: "mod_channel_id",
  convites: "invite_channel_id",
};

const command: SlashCommand = {
  category: "config",
  cooldown: 3,
  guildOnly: true,
  staffOnly: true,
  longDescription:
    "Configure e consulte o sistema de logs do servidor. Defina canais por categoria, ignore canais/usuários e veja eventos recentes.",
  data: new SlashCommandBuilder()
    .setName("logs")
    .setDescription("Configuração e auditoria do sistema de logs.")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s.setName("status").setDescription("Mostra a configuração atual de logs."),
    )
    .addSubcommand((s) =>
      s
        .setName("canal")
        .setDescription("Define o canal de uma categoria.")
        .addStringOption((o) =>
          o
            .setName("categoria")
            .setDescription("Categoria de logs")
            .setRequired(true)
            .addChoices(
              ...Object.keys(CATEGORY_COLUMNS).map((k) => ({ name: k, value: k })),
            ),
        )
        .addChannelOption((o) =>
          o
            .setName("canal")
            .setDescription("Canal (omitir para limpar)")
            .addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("ignorar")
        .setDescription("Adiciona/remove um canal ou usuário da lista de ignorados.")
        .addStringOption((o) =>
          o
            .setName("tipo")
            .setDescription("Tipo")
            .setRequired(true)
            .addChoices(
              { name: "canal", value: "ignored_channels" },
              { name: "usuario", value: "ignored_users" },
              { name: "cargo", value: "ignored_roles" },
            ),
        )
        .addStringOption((o) =>
          o.setName("id").setDescription("ID do canal/usuário/cargo").setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("ver")
        .setDescription("Consulta eventos recentes do audit log.")
        .addStringOption((o) =>
          o
            .setName("categoria")
            .setDescription("Filtrar por categoria")
            .addChoices(
              { name: "member", value: "member" },
              { name: "message", value: "message" },
              { name: "role", value: "role" },
              { name: "channel", value: "channel" },
              { name: "voice", value: "voice" },
              { name: "server", value: "server" },
              { name: "mod", value: "mod" },
              { name: "invite", value: "invite" },
            ),
        )
        .addUserOption((o) =>
          o.setName("usuario").setDescription("Filtrar por usuário-alvo"),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const sub = interaction.options.getSubcommand(true);

    if (sub === "status") {
      const cfg = await getLogsConfig(guildId);
      const fmt = (id: string | null | undefined) => (id ? `<#${id}>` : "—");
      const fields = Object.entries(CATEGORY_COLUMNS).map(([name, col]) => ({
        name,
        value: fmt((cfg as Record<string, string | null> | null)?.[col] ?? null),
        inline: true,
      }));
      return interaction.reply({
        embeds: [
          brandEmbed({
            title: "📜 Configuração de Logs",
            description: cfg
              ? `Ignorados: ${cfg.ignored_channels?.length ?? 0} canais · ${cfg.ignored_users?.length ?? 0} usuários · ${cfg.ignored_roles?.length ?? 0} cargos`
              : "_Nenhuma configuração ainda — defina um canal com `/logs canal`._",
            fields,
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "canal") {
      const categoria = interaction.options.getString("categoria", true);
      const canal = interaction.options.getChannel("canal");
      const col = CATEGORY_COLUMNS[categoria];
      if (!col) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Categoria inválida", description: `Categoria \`${categoria}\` desconhecida.` })],
          flags: MessageFlags.Ephemeral,
        });
      }
      const { error } = await supabase.from("guild_logs_config").upsert(
        { guild_id: guildId, [col]: canal?.id ?? null },
        { onConflict: "guild_id" },
      );
      invalidateLogsConfig(guildId);
      if (error) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Falha", description: error.message })],
          flags: MessageFlags.Ephemeral,
        });
      }
      return interaction.reply({
        embeds: [
          brandEmbed({
            kind: "success",
            title: `Categoria \`${categoria}\` ${canal ? `definida em <#${canal.id}>` : "limpa"}.`,
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "ignorar") {
      const tipo = interaction.options.getString("tipo", true);
      const id = interaction.options.getString("id", true);
      const cfg = await getLogsConfig(guildId);
      const current = ((cfg as Record<string, string[] | null> | null)?.[tipo] ?? []) as string[];
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
      const { error } = await supabase
        .from("guild_logs_config")
        .upsert({ guild_id: guildId, [tipo]: next }, { onConflict: "guild_id" });
      invalidateLogsConfig(guildId);
      if (error) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Falha", description: error.message })],
          flags: MessageFlags.Ephemeral,
        });
      }
      return interaction.reply({
        embeds: [
          brandEmbed({
            kind: "success",
            title: current.includes(id) ? "Removido da lista de ignorados." : "Adicionado à lista de ignorados.",
            description: `\`${id}\` em **${tipo}** (total: ${next.length})`,
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "ver") {
      const categoria = interaction.options.getString("categoria");
      const user = interaction.options.getUser("usuario");
      let q = supabase
        .from("server_audit_logs")
        .select("event,category,target_id,target_tag,channel_id,created_at")
        .eq("guild_id", guildId)
        .order("created_at", { ascending: false })
        .limit(15);
      if (categoria) q = q.eq("category", categoria);
      if (user) q = q.eq("target_id", user.id);
      const { data } = await q;
      const lines =
        (data ?? [])
          .map(
            (r) =>
              `\`${r.category}\` **${r.event}** · ${r.target_tag ?? r.target_id ?? "—"}${r.channel_id ? ` em <#${r.channel_id}>` : ""} · <t:${Math.floor(new Date(r.created_at).getTime() / 1000)}:R>`,
          )
          .join("\n") || "_Nenhum evento encontrado._";
      return interaction.reply({
        embeds: [brandEmbed({ title: "📚 Audit log recente", description: lines })],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default command;
