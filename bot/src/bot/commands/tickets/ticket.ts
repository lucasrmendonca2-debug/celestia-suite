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
    )
    .addSubcommand((s) =>
      s.setName("metricas").setDescription("Mostra métricas do sistema de tickets."),
    )
    .addSubcommand((s) =>
      s
        .setName("resposta")
        .setDescription("Gerencia respostas rápidas de staff.")
        .addStringOption((o) =>
          o
            .setName("acao")
            .setDescription("Ação")
            .setRequired(true)
            .addChoices(
              { name: "Usar", value: "usar" },
              { name: "Listar", value: "listar" },
              { name: "Criar", value: "criar" },
              { name: "Remover", value: "remover" },
            ),
        )
        .addStringOption((o) =>
          o.setName("slug").setDescription("Identificador curto (ex: ola, encerrar)"),
        )
        .addStringOption((o) =>
          o.setName("conteudo").setDescription("Conteúdo da resposta (ao criar)"),
        ),
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
    if (sub === "metricas") return runMetricas(interaction);
    if (sub === "resposta") return runResposta(interaction);
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
      flags: MessageFlags.Ephemeral,
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
      flags: MessageFlags.Ephemeral,
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
      flags: MessageFlags.Ephemeral,
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
    flags: MessageFlags.Ephemeral,
  });
}

async function runFechar(interaction: ChatInputCommandInteraction) {
  try {
    await closeTicketSlash(interaction);
    if (!interaction.replied) {
      await interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "Ticket fechado" })],
        flags: MessageFlags.Ephemeral,
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
      flags: MessageFlags.Ephemeral,
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
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "error", title: "Erro", description: (err as Error).message })],
      flags: MessageFlags.Ephemeral,
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
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "error", title: "Erro", description: (err as Error).message })],
      flags: MessageFlags.Ephemeral,
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
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "error", title: "Erro", description: (err as Error).message })],
      flags: MessageFlags.Ephemeral,
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
    flags: MessageFlags.Ephemeral,
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
      flags: MessageFlags.Ephemeral,
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
      flags: MessageFlags.Ephemeral,
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
      flags: MessageFlags.Ephemeral,
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
      flags: MessageFlags.Ephemeral,
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
      flags: MessageFlags.Ephemeral,
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
    flags: MessageFlags.Ephemeral,
  });
}

async function runRenomear(interaction: ChatInputCommandInteraction) {
  if (!(await ensureStaff(interaction))) return;
  const nome = interaction.options.getString("nome", true).slice(0, 90);
  const channel = interaction.channel as TextChannel;
  await channel.setName(nome).catch(() => {});
  await interaction.reply({
    embeds: [brandEmbed({ kind: "success", title: `Canal renomeado para \`${nome}\`` })],
    flags: MessageFlags.Ephemeral,
  });
}

async function runMetricas(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const guildId = interaction.guildId!;
  const since = new Date(Date.now() - 7 * 86400 * 1000).toISOString();

  const [{ count: openCount }, { count: closedWeek }, { data: rows }] = await Promise.all([
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("guild_id", guildId)
      .eq("status", "open"),
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("guild_id", guildId)
      .eq("status", "closed")
      .gte("closed_at", since),
    supabase
      .from("tickets")
      .select("created_at,first_response_at,closed_at,claimed_by,status")
      .eq("guild_id", guildId)
      .gte("created_at", since)
      .limit(500),
  ]);

  let firstRespMs = 0;
  let firstRespN = 0;
  let resolutionMs = 0;
  let resolutionN = 0;
  const byClaim = new Map<string, number>();
  for (const r of rows ?? []) {
    if (r.first_response_at) {
      firstRespMs += new Date(r.first_response_at).getTime() - new Date(r.created_at).getTime();
      firstRespN++;
    }
    if (r.closed_at) {
      resolutionMs += new Date(r.closed_at).getTime() - new Date(r.created_at).getTime();
      resolutionN++;
    }
    if (r.claimed_by) byClaim.set(r.claimed_by, (byClaim.get(r.claimed_by) ?? 0) + 1);
  }

  const fmt = (ms: number) => {
    if (!ms) return "—";
    const m = Math.round(ms / 60000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  };
  const top = [...byClaim.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, n], i) => `**${i + 1}.** <@${id}> · ${n} ticket${n > 1 ? "s" : ""}`)
    .join("\n") || "_Nenhum ticket atribuído nos últimos 7 dias._";

  await interaction.editReply({
    embeds: [
      brandEmbed({
        title: "📊 Métricas de Tickets",
        description: `Janela: últimos **7 dias**`,
        fields: [
          { name: "Abertos agora", value: String(openCount ?? 0), inline: true },
          { name: "Fechados (7d)", value: String(closedWeek ?? 0), inline: true },
          { name: "Criados (7d)", value: String(rows?.length ?? 0), inline: true },
          { name: "1ª resposta média", value: fmt(firstRespN ? firstRespMs / firstRespN : 0), inline: true },
          { name: "Resolução média", value: fmt(resolutionN ? resolutionMs / resolutionN : 0), inline: true },
          { name: "Top staff (claims)", value: top, inline: false },
        ],
      }),
    ],
  });
}

async function runResposta(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const acao = interaction.options.getString("acao", true);
  const slug = interaction.options.getString("slug")?.toLowerCase().trim() ?? null;
  const conteudo = interaction.options.getString("conteudo");

  const member = interaction.member;
  const isStaff =
    !!member &&
    typeof member.permissions !== "string" &&
    member.permissions.has(PermissionFlagsBits.ManageMessages);

  if (acao === "listar") {
    const { data } = await supabase
      .from("ticket_quick_replies")
      .select("slug,content")
      .eq("guild_id", guildId)
      .order("slug", { ascending: true })
      .limit(25);
    const lines = (data ?? [])
      .map((r) => `• \`${r.slug}\` — ${r.content.slice(0, 80)}${r.content.length > 80 ? "…" : ""}`)
      .join("\n");
    await interaction.reply({
      embeds: [
        brandEmbed({
          title: "💬 Respostas rápidas",
          description: lines || "_Nenhuma resposta cadastrada. Use `acao:Criar` para começar._",
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (acao === "criar") {
    if (!isStaff) {
      await interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão para criar." })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (!slug || !conteudo) {
      await interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Informe `slug` e `conteudo`." })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const { error } = await supabase.from("ticket_quick_replies").upsert(
      {
        guild_id: guildId,
        slug,
        content: conteudo,
        created_by: interaction.user.id,
      },
      { onConflict: "guild_id,slug" },
    );
    if (error) {
      await interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Falha ao salvar", description: error.message })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.reply({
      embeds: [brandEmbed({ kind: "success", title: `Resposta \`${slug}\` salva.` })],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (acao === "remover") {
    if (!isStaff) {
      await interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão." })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (!slug) {
      await interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Informe `slug`." })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await supabase.from("ticket_quick_replies").delete().eq("guild_id", guildId).eq("slug", slug);
    await interaction.reply({
      embeds: [brandEmbed({ kind: "success", title: `Resposta \`${slug}\` removida.` })],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // usar
  if (!slug) {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "error", title: "Informe `slug` da resposta a usar." })],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const ticket = await findTicketByChannel(interaction.channelId);
  if (!ticket) {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "error", title: "Use dentro de um ticket." })],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const { data: qr } = await supabase
    .from("ticket_quick_replies")
    .select("content")
    .eq("guild_id", guildId)
    .eq("slug", slug)
    .maybeSingle();
  if (!qr) {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "error", title: `Resposta \`${slug}\` não existe.` })],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const channel = interaction.channel as TextChannel | null;
  if (!channel?.isTextBased()) return;
  await channel.send({ content: qr.content });
  await interaction.reply({
    embeds: [brandEmbed({ kind: "success", title: "Resposta enviada." })],
    flags: MessageFlags.Ephemeral,
  });
}
