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
  addUserToTicket,
  closeTicketSlash,
  removeUserFromTicket,
  reopenTicket,
} from "../../systems/tickets/handlers.js";
import {
  getTicketConfig,
  listActiveCategories,
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
      s.setName("reabrir").setDescription("Reabre este ticket fechado."),
    )
    .addSubcommand((s) =>
      s
        .setName("adicionar")
        .setDescription("Adiciona um usuário a este ticket.")
        .addUserOption((o) =>
          o.setName("usuario").setDescription("Usuário a adicionar").setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("remover")
        .setDescription("Remove um usuário deste ticket.")
        .addUserOption((o) =>
          o.setName("usuario").setDescription("Usuário a remover").setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s.setName("configurar").setDescription("Mostra a configuração atual do sistema de tickets."),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand(true);

    if (sub === "painel") return runPainel(interaction);
    if (sub === "fechar") return runFechar(interaction);
    if (sub === "reabrir") return runReabrir(interaction);
    if (sub === "adicionar") return runAdicionar(interaction);
    if (sub === "remover") return runRemover(interaction);
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

  const categories = await listActiveCategories(interaction.guildId!);
  const msg = await target.send({
    embeds: [buildPanelEmbed(cfg, interaction.guild!.name)],
    components: buildPanelComponents(cfg, categories),
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
  const dashUrl = `${env.APP_URL.replace(/\/$/, "")}/dashboard/${interaction.guildId}/tickets`;

  const linkRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel("Abrir dashboard")
      .setEmoji("🌐")
      .setURL(dashUrl),
  );

  await interaction.reply({
    embeds: [
      brandEmbed({
        kind: "info",
        title: "⚙️ Configuração de Tickets",
        description: `Toda configuração é feita pelo **dashboard web**. Abre rapidinho aí ⬇️\n\n🔗 ${dashUrl}`,
        fields: [
          { name: "Sistema", value: cfg.enabled ? "🟢 Ativo" : "🔴 Desativado", inline: true },
          {
            name: "Canal do painel",
            value: cfg.panel_channel_id ? `<#${cfg.panel_channel_id}>` : "_não definido_",
            inline: true,
          },
          {
            name: "Cargo de suporte",
            value: cfg.default_support_role_id
              ? `<@&${cfg.default_support_role_id}>`
              : "_não definido_",
            inline: true,
          },
        ],
      }),
    ],
    components: [linkRow],
    ephemeral: true,
  });
}

export default command;
