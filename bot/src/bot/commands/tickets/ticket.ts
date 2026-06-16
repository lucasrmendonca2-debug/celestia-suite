import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { env } from "../../../config/env.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import {
  closeTicketSlash,
} from "../../systems/tickets/handlers.js";
import {
  getTicketConfig,
  setPanelMessage,
} from "../../systems/tickets/ticket.service.js";
import {
  buildPanelComponents,
  buildPanelEmbed,
} from "../../systems/tickets/ticket.components.js";

const command: SlashCommand = {
  category: "tickets",
  cooldown: 3,
  guildOnly: true,
  longDescription:
    "Sistema de tickets profissional. Use `/ticket painel` para enviar o painel único de atendimento, ou `/ticket fechar` dentro de um ticket.",
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Sistema de tickets do Zenox.")
    .setDMPermission(false)
    .addSubcommand((s) =>
      s
        .setName("painel")
        .setDescription("Envia o painel único de tickets no canal configurado (ou neste).")
        .addChannelOption((o) =>
          o
            .setName("canal")
            .setDescription("Canal onde o painel será enviado (padrão: o configurado).")
            .addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("fechar")
        .setDescription("Fecha este ticket.")
        .addStringOption((o) =>
          o.setName("motivo").setDescription("Motivo do fechamento (opcional)"),
        ),
    )
    .addSubcommand((s) =>
      s.setName("configurar").setDescription("Mostra a configuração atual do sistema de tickets."),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand(true);

    if (sub === "painel") return runPainel(interaction);
    if (sub === "fechar") return runFechar(interaction);
    if (sub === "configurar") return runConfigurar(interaction);
  },
};

async function runPainel(interaction: ChatInputCommandInteraction) {
  // só admins/gerenciar servidor podem enviar painel
  const member = interaction.member;
  if (
    !member ||
    typeof member.permissions === "string" ||
    !member.permissions.has(PermissionFlagsBits.ManageGuild)
  ) {
    await interaction.reply({
      embeds: [
        brandEmbed({
          kind: "error",
          title: "Sem permissão",
          description: "Você precisa da permissão **Gerenciar Servidor** para enviar o painel.",
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  const cfg = await getTicketConfig(interaction.guildId!);
  if (!cfg.enabled) {
    await interaction.reply({
      embeds: [
        brandEmbed({
          kind: "warn",
          title: "Sistema desativado",
          description:
            "Ative o sistema de tickets pelo **dashboard** antes de enviar o painel.",
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  const target =
    (interaction.options.getChannel("canal") as TextChannel | null) ??
    (cfg.panel_channel_id
      ? (interaction.guild!.channels.cache.get(cfg.panel_channel_id) as TextChannel | undefined)
      : null) ??
    (interaction.channel as TextChannel);

  if (!target || target.type !== ChannelType.GuildText) {
    await interaction.reply({
      embeds: [
        brandEmbed({
          kind: "error",
          title: "Canal inválido",
          description: "Escolha um canal de texto ou configure um canal padrão no dashboard.",
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  const msg = await target.send({
    embeds: [buildPanelEmbed(cfg, interaction.guild!.name)],
    components: buildPanelComponents(cfg),
  });

  await setPanelMessage(interaction.guildId!, target.id, msg.id);

  await interaction.reply({
    embeds: [
      brandEmbed({
        kind: "success",
        title: "Painel enviado!",
        description: `Painel publicado em <#${target.id}>.`,
      }),
    ],
    ephemeral: true,
  });
}

async function runFechar(interaction: ChatInputCommandInteraction) {
  try {
    await closeTicketSlash(interaction);
    if (!interaction.replied) {
      await interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "Ticket fechado" })],
        ephemeral: true,
      });
    }
  } catch (err) {
    await interaction.reply({
      embeds: [
        brandEmbed({
          kind: "error",
          title: "Erro",
          description: (err as Error).message,
        }),
      ],
      ephemeral: true,
    });
  }
}

async function runConfigurar(interaction: ChatInputCommandInteraction) {
  const cfg = await getTicketConfig(interaction.guildId!);
  await interaction.reply({
    embeds: [
      brandEmbed({
        kind: "info",
        title: "⚙️ Configuração de Tickets",
        description:
          "Use o dashboard web pra editar tudo. Aqui só uma prévia rápida do que está salvo.",
        fields: [
          { name: "Sistema", value: cfg.enabled ? "🟢 Ativo" : "🔴 Desativado", inline: true },
          {
            name: "Limite por usuário",
            value: `${cfg.max_open_tickets_per_user}`,
            inline: true,
          },
          {
            name: "Canal do painel",
            value: cfg.panel_channel_id ? `<#${cfg.panel_channel_id}>` : "_não definido_",
            inline: true,
          },
          {
            name: "Categoria Discord",
            value: cfg.category_id ? `<#${cfg.category_id}>` : "_não definida_",
            inline: true,
          },
          {
            name: "Cargo de suporte",
            value: cfg.default_support_role_id
              ? `<@&${cfg.default_support_role_id}>`
              : "_não definido_",
            inline: true,
          },
          {
            name: "Canal de logs",
            value: cfg.log_channel_id ? `<#${cfg.log_channel_id}>` : "_não definido_",
            inline: true,
          },
        ],
      }),
    ],
    ephemeral: true,
  });
}

export default command;
