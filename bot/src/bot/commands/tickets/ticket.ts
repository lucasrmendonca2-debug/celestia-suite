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
import { supabase } from "../../../database/supabase.js";
import {
  addUserToTicket,
  closeTicketSlash,
  removeUserFromTicket,
  reopenTicket,
} from "../../systems/tickets/handlers.js";
import {
  claimTicketRow,
  findTicketByChannel,
  getTicketConfig,
  listActiveCategories,
  setPanelMessage,
} from "../../systems/tickets/ticket.service.js";
import {
  buildPanelComponents,
  buildPanelEmbed,
} from "../../systems/tickets/ticket.components.js";

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "🟢 Baixa",
  MEDIUM: "🟡 Média",
  HIGH: "🟠 Alta",
  URGENT: "🔴 Urgente",
};

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
    )
    .addSubcommand((s) =>
      s.setName("claim").setDescription("Atribui este ticket a você."),
    )
    .addSubcommand((s) =>
      s
        .setName("prioridade")
        .setDescription("Define a prioridade deste ticket.")
        .addStringOption((o) =>
          o
            .setName("nivel")
            .setDescription("Nível de prioridade")
            .setRequired(true)
            .addChoices(
              { name: "🟢 Baixa", value: "LOW" },
              { name: "🟡 Média", value: "MEDIUM" },
              { name: "🟠 Alta", value: "HIGH" },
              { name: "🔴 Urgente", value: "URGENT" },
            ),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("nota")
        .setDescription("Adiciona uma nota interna (visível apenas para staff).")
        .addStringOption((o) => o.setName("conteudo").setDescription("Conteúdo da nota").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("renomear")
        .setDescription("Renomeia este canal de ticket.")
        .addStringOption((o) => o.setName("nome").setDescription("Novo nome").setRequired(true)),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand(true);

    if (sub === "painel") return runPainel(interaction);
    if (sub === "fechar") return runFechar(interaction);
    if (sub === "reabrir") return runReabrir(interaction);
    if (sub === "adicionar") return runAdicionar(interaction);
    if (sub === "remover") return runRemover(interaction);
    if (sub === "configurar") return runConfigurar(interaction);
    if (sub === "claim") return runClaim(interaction);
    if (sub === "prioridade") return runPrioridade(interaction);
    if (sub === "nota") return runNota(interaction);
    if (sub === "renomear") return runRenomear(interaction);
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

async function runReabrir(interaction: ChatInputCommandInteraction) {
  try {
    await reopenTicket(
      interaction.channel as TextChannel,
      interaction.member as import("discord.js").GuildMember,
    );
    await interaction.reply({
      embeds: [brandEmbed({ kind: "success", title: "Ticket reaberto" })],
      ephemeral: true,
    });
  } catch (err) {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "error", title: "Erro", description: (err as Error).message })],
      ephemeral: true,
    });
  }
}

async function runAdicionar(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("usuario", true);
  try {
    await addUserToTicket(
      interaction.channel as TextChannel,
      interaction.member as import("discord.js").GuildMember,
      user.id,
    );
    await interaction.reply({
      embeds: [brandEmbed({ kind: "success", title: "Usuário adicionado" })],
      ephemeral: true,
    });
  } catch (err) {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "error", title: "Erro", description: (err as Error).message })],
      ephemeral: true,
    });
  }
}

async function runRemover(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("usuario", true);
  try {
    await removeUserFromTicket(
      interaction.channel as TextChannel,
      interaction.member as import("discord.js").GuildMember,
      user.id,
    );
    await interaction.reply({
      embeds: [brandEmbed({ kind: "success", title: "Usuário removido" })],
      ephemeral: true,
    });
  } catch (err) {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "error", title: "Erro", description: (err as Error).message })],
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

/* ============ Tickets v2: claim / prioridade / nota / renomear ============ */

async function ensureStaff(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const member = interaction.member;
  if (
    !member ||
    typeof member.permissions === "string" ||
    !member.permissions.has(PermissionFlagsBits.ManageMessages)
  ) {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "error", title: "Sem permissão de staff." })],
      ephemeral: true,
    });
    return false;
  }
  return true;
}

async function runClaim(interaction: ChatInputCommandInteraction) {
  if (!(await ensureStaff(interaction))) return;
  const ticket = await findTicketByChannel(interaction.channelId!);
  if (!ticket) {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "error", title: "Este canal não é um ticket." })],
      ephemeral: true,
    });
    return;
  }
  if (ticket.claimed_by && ticket.claimed_by !== interaction.user.id) {
    await interaction.reply({
      embeds: [
        brandEmbed({
          kind: "warn",
          title: "Já reivindicado",
          description: `Este ticket já é de <@${ticket.claimed_by}>.`,
        }),
      ],
      ephemeral: true,
    });
    return;
  }
  await claimTicketRow(ticket.id, interaction.user.id);
  await supabase
    .from("tickets")
    .update({ claimed_at: new Date().toISOString() })
    .eq("id", ticket.id);
  await interaction.reply({
    embeds: [
      brandEmbed({
        kind: "success",
        title: "Ticket reivindicado",
        description: `<@${interaction.user.id}> está cuidando deste ticket.`,
      }),
    ],
  });
}

async function runPrioridade(interaction: ChatInputCommandInteraction) {
  if (!(await ensureStaff(interaction))) return;
  const ticket = await findTicketByChannel(interaction.channelId!);
  if (!ticket) {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "error", title: "Este canal não é um ticket." })],
      ephemeral: true,
    });
    return;
  }
  const level = interaction.options.getString("nivel", true);
  await supabase.from("tickets").update({ priority_level: level }).eq("id", ticket.id);
  await interaction.reply({
    embeds: [
      brandEmbed({
        kind: "info",
        title: "Prioridade atualizada",
        description: `Nova prioridade: **${PRIORITY_LABELS[level] ?? level}**`,
      }),
    ],
  });
}

async function runNota(interaction: ChatInputCommandInteraction) {
  if (!(await ensureStaff(interaction))) return;
  const ticket = await findTicketByChannel(interaction.channelId!);
  if (!ticket) {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "error", title: "Este canal não é um ticket." })],
      ephemeral: true,
    });
    return;
  }
  const content = interaction.options.getString("conteudo", true);
  await supabase.from("ticket_notes").insert({
    ticket_id: ticket.id,
    guild_id: ticket.guild_id,
    author_id: interaction.user.id,
    author_tag: interaction.user.tag,
    content,
    internal: true,
  });
  await interaction.reply({
    embeds: [
      brandEmbed({
        kind: "info",
        title: "📝 Nota interna registrada",
        description: content,
        footer: `Por ${interaction.user.tag} — visível apenas no dashboard`,
      }),
    ],
    ephemeral: true,
  });
}

async function runRenomear(interaction: ChatInputCommandInteraction) {
  if (!(await ensureStaff(interaction))) return;
  const nome = interaction.options.getString("nome", true).slice(0, 90);
  const channel = interaction.channel as TextChannel;
  await channel.setName(nome).catch(() => {});
  await interaction.reply({
    embeds: [brandEmbed({ kind: "success", title: `Canal renomeado para \`${nome}\`` })],
    ephemeral: true,
  });
}
