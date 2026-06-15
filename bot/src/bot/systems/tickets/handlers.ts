import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  Guild,
  GuildMember,
  OverwriteType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { Ticket, TicketPanel } from "../../../database/models.js";
import { brandEmbed } from "../../utils/embed.js";
import { getConfig } from "../../utils/guildCache.js";
import { sendLog } from "../logs/sender.js";

const MAX_OPEN_PER_USER = 1;

export async function openTicket(guild: Guild, member: GuildMember, panelId?: string) {
  const open = await Ticket.countDocuments({ guildId: guild.id, userId: member.id, status: "OPEN" });
  if (open >= MAX_OPEN_PER_USER) {
    throw new Error(`Você já tem **${open}** ticket(s) aberto(s). Feche antes de abrir outro.`);
  }

  const panel = panelId ? await TicketPanel.findById(panelId) : null;
  const cfg = await getConfig(guild.id);
  const supportRoleId = panel?.supportRoleId ?? cfg.supportRoleId ?? null;
  const parentId = panel?.categoryId ?? null;

  const channel = await guild.channels.create({
    name: `ticket-${member.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 90),
    type: ChannelType.GuildText,
    parent: parentId ?? undefined,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: member.id,
        type: OverwriteType.Member,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      ...(supportRoleId
        ? [{
            id: supportRoleId,
            type: OverwriteType.Role,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          }]
        : []),
    ],
  });

  const ticket = await Ticket.create({
    guildId: guild.id,
    panelId: panel?._id,
    channelId: channel.id,
    userId: member.id,
    status: "OPEN",
  });

  const embed = brandEmbed({
    kind: "default",
    title: `🎫 Ticket aberto`,
    description: `Olá <@${member.id}>! Descreva sua dúvida com calma — a equipe ${supportRoleId ? `<@&${supportRoleId}>` : "de suporte"} já foi notificada.`,
    fields: [{ name: "ID", value: `\`${ticket._id}\``, inline: true }],
  });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`ticket:close:${ticket._id}`).setLabel("Fechar").setStyle(ButtonStyle.Danger).setEmoji("🔒"),
    new ButtonBuilder().setCustomId(`ticket:claim:${ticket._id}`).setLabel("Assumir").setStyle(ButtonStyle.Secondary).setEmoji("✋"),
  );

  await channel.send({
    content: [`<@${member.id}>`, supportRoleId ? `<@&${supportRoleId}>` : ""].filter(Boolean).join(" "),
    embeds: [embed],
    components: [row],
  });

  await sendLog(
    guild,
    "ticketLogChannelId",
    brandEmbed({ kind: "info", title: "Ticket aberto", description: `Por <@${member.id}> em <#${channel.id}>` }),
    "ticket.open",
    { ticketId: String(ticket._id), userId: member.id, channelId: channel.id },
  );

  return { ticket, channel };
}

export async function closeTicket(channel: TextChannel, closedById: string) {
  const ticket = await Ticket.findOne({ channelId: channel.id });
  if (!ticket || ticket.status !== "OPEN") throw new Error("Este canal não é um ticket aberto.");

  ticket.status = "CLOSED";
  ticket.closedById = closedById;
  ticket.closedAt = new Date();
  await ticket.save();

  await channel.send({
    embeds: [brandEmbed({ kind: "warn", title: "Ticket fechado", description: `Fechado por <@${closedById}>. O canal será arquivado em instantes.` })],
  });

  await sendLog(
    channel.guild,
    "ticketLogChannelId",
    brandEmbed({ kind: "warn", title: "Ticket fechado", description: `Ticket \`${ticket._id}\` fechado por <@${closedById}>.` }),
    "ticket.close",
    { ticketId: String(ticket._id), closedById },
  );

  await channel.permissionOverwrites.edit(ticket.userId, { SendMessages: false }).catch(() => {});
}

export async function handleTicketButton(interaction: ButtonInteraction) {
  const [, action, ticketId] = interaction.customId.split(":");
  if (!interaction.guild || !interaction.channel?.isTextBased()) return;

  if (action === "open") {
    const panelId = ticketId;
    try {
      const { channel } = await openTicket(interaction.guild, interaction.member as GuildMember, panelId);
      await interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "Ticket criado", description: `Veja em <#${channel.id}>` })],
        ephemeral: true,
      });
    } catch (err) {
      await interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Não foi possível abrir o ticket", description: (err as Error).message })],
        ephemeral: true,
      });
    }
    return;
  }

  if (action === "close") {
    try {
      await closeTicket(interaction.channel as TextChannel, interaction.user.id);
      await interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "Fechado", description: "Ticket marcado como fechado." })],
        ephemeral: true,
      });
    } catch (err) {
      await interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Erro", description: (err as Error).message })],
        ephemeral: true,
      });
    }
    return;
  }

  if (action === "claim") {
    await interaction.reply({
      embeds: [brandEmbed({ kind: "info", title: "Assumido", description: `<@${interaction.user.id}> assumiu este ticket.` })],
    });
  }
}
