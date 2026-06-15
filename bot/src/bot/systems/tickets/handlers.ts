import {
  ButtonInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  OverwriteType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { brandEmbed } from "../../utils/embed.js";
import {
  closeTicketRow,
  countOpenTickets,
  createTicketRow,
  findTicketByChannel,
  getTicketConfig,
  writeLog,
  type TicketConfig,
} from "./ticket.service.js";
import {
  buildClosedEmbed,
  buildLogEmbed,
  buildTicketActions,
  buildWelcomeEmbed,
} from "./ticket.components.js";
import { canMemberClose } from "./ticket.permissions.js";

/* ===================== OPEN ===================== */

export async function openTicket(
  guild: Guild,
  member: GuildMember,
): Promise<{ channelId: string; ticketId: string }> {
  const cfg = await getTicketConfig(guild.id);

  if (!cfg.enabled) {
    throw new Error("O sistema de tickets ainda não foi ativado neste servidor.");
  }

  // limite
  const open = await countOpenTickets(guild.id, member.id);
  if (open >= cfg.max_open_tickets_per_user) {
    throw new Error(
      `Você já possui o número máximo de tickets abertos (${cfg.max_open_tickets_per_user}). Feche algum antes de abrir outro.`,
    );
  }

  // permissão do bot
  const me = guild.members.me;
  if (!me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
    throw new Error(
      "Não consegui criar o ticket porque estou sem a permissão **Gerenciar Canais**. Avise um administrador.",
    );
  }

  const supportRoleId = cfg.default_support_role_id;
  const parentId = cfg.category_id;

  // nome seguro
  const safeName = `ticket-${member.user.username}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 90);

  const channel = await guild.channels.create({
    name: safeName,
    type: ChannelType.GuildText,
    parent: parentId ?? undefined,
    topic: `Ticket de ${member.user.tag} • ${member.id}`,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        type: OverwriteType.Role,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: member.id,
        type: OverwriteType.Member,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
      {
        id: me.id,
        type: OverwriteType.Member,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
      ...(supportRoleId
        ? [
            {
              id: supportRoleId,
              type: OverwriteType.Role,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
              ],
            },
          ]
        : []),
    ],
  });

  const ticket = await createTicketRow({
    guild_id: guild.id,
    channel_id: channel.id,
    user_id: member.id,
    username: member.user.username,
    category_name: "Geral",
  });

  const welcome = buildWelcomeEmbed(cfg, ticket.id, member.id, supportRoleId);
  const actions = buildTicketActions(true);

  await channel.send({
    content: [`<@${member.id}>`, supportRoleId ? `<@&${supportRoleId}>` : ""]
      .filter(Boolean)
      .join(" "),
    embeds: [welcome],
    components: [actions],
  });

  await writeLog(guild.id, ticket.id, "opened", member.id, {
    channelId: channel.id,
  });
  await sendOpenedLog(guild, cfg, channel, member);

  return { channelId: channel.id, ticketId: ticket.id };
}

/* ===================== CLOSE ===================== */

export async function closeTicket(
  channel: TextChannel,
  member: GuildMember,
  reason?: string,
): Promise<void> {
  const guild = channel.guild;
  const cfg = await getTicketConfig(guild.id);
  const ticket = await findTicketByChannel(channel.id);
  if (!ticket || ticket.status !== "open") {
    throw new Error("Este canal não é um ticket aberto.");
  }

  const allowed = await canMemberClose(member, ticket.user_id, cfg.allow_user_close_ticket);
  if (!allowed) {
    throw new Error("Você não tem permissão para fechar este ticket.");
  }

  await closeTicketRow(ticket.id, member.id, reason);

  // tira permissão de envio do dono
  await channel.permissionOverwrites
    .edit(ticket.user_id, { SendMessages: false })
    .catch(() => {});

  await channel.send({
    embeds: [buildClosedEmbed(cfg.close_message, member.id, cfg.panel_color)],
  });

  await writeLog(guild.id, ticket.id, "closed", member.id, { reason: reason ?? null });
  await sendClosedLog(guild, cfg, channel, member, ticket.user_id);

  // renomeia opcionalmente
  await channel.setName(`closed-${ticket.username}`.slice(0, 90)).catch(() => {});
}

/* ===================== LOGS ===================== */

async function sendOpenedLog(
  guild: Guild,
  cfg: TicketConfig,
  channel: TextChannel,
  member: GuildMember,
) {
  if (!cfg.log_channel_id) return;
  const logCh = guild.channels.cache.get(cfg.log_channel_id);
  if (!logCh || logCh.type !== ChannelType.GuildText) return;
  await (logCh as TextChannel)
    .send({
      embeds: [
        buildLogEmbed({
          title: "🟢 Ticket aberto",
          color: 0x22c55e,
          fields: [
            { name: "Usuário", value: `<@${member.id}>`, inline: true },
            { name: "Canal", value: `<#${channel.id}>`, inline: true },
            { name: "ID", value: member.id, inline: false },
          ],
        }),
      ],
    })
    .catch(() => {});
}

async function sendClosedLog(
  guild: Guild,
  cfg: TicketConfig,
  channel: TextChannel,
  staff: GuildMember,
  ownerId: string,
) {
  if (!cfg.log_channel_id) return;
  const logCh = guild.channels.cache.get(cfg.log_channel_id);
  if (!logCh || logCh.type !== ChannelType.GuildText) return;
  await (logCh as TextChannel)
    .send({
      embeds: [
        buildLogEmbed({
          title: "🔴 Ticket fechado",
          color: 0xef4444,
          fields: [
            { name: "Dono", value: `<@${ownerId}>`, inline: true },
            { name: "Fechado por", value: `<@${staff.id}>`, inline: true },
            { name: "Canal", value: `<#${channel.id}>`, inline: false },
          ],
        }),
      ],
    })
    .catch(() => {});
}

/* ===================== BUTTON ENTRY POINT ===================== */

export async function handleTicketButton(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild || !interaction.isButton()) return;
  const [, action] = interaction.customId.split(":");

  if (action === "open") {
    try {
      const { channelId } = await openTicket(
        interaction.guild,
        interaction.member as GuildMember,
      );
      await interaction.reply({
        embeds: [
          brandEmbed({
            kind: "success",
            title: "Prontinho!",
            description: `Seu ticket foi criado em <#${channelId}>.`,
          }),
        ],
        ephemeral: true,
      });
    } catch (err) {
      await interaction.reply({
        embeds: [
          brandEmbed({
            kind: "error",
            title: "Não foi possível abrir o ticket",
            description: (err as Error).message,
          }),
        ],
        ephemeral: true,
      });
    }
    return;
  }

  if (action === "close") {
    try {
      await closeTicket(
        interaction.channel as TextChannel,
        interaction.member as GuildMember,
      );
      await interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "Ticket fechado" })],
        ephemeral: true,
      });
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
    return;
  }

  if (action === "claim") {
    await interaction.reply({
      embeds: [
        brandEmbed({
          kind: "info",
          title: "Assumido",
          description: `<@${interaction.user.id}> assumiu este ticket. (em breve: persistência)`,
        }),
      ],
    });
  }
}

/* ===================== SLASH ENTRY POINTS ===================== */

export async function closeTicketSlash(interaction: ChatInputCommandInteraction): Promise<void> {
  const reason = interaction.options.getString("motivo") ?? undefined;
  await closeTicket(
    interaction.channel as TextChannel,
    interaction.member as GuildMember,
    reason,
  );
}
