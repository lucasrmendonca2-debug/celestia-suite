import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type APIEmbed,
  type APIActionRowComponent,
  type APIMessageActionRowComponent,
} from "discord.js";
import type { TicketConfig } from "./ticket.service.js";

export function buildPanelEmbed(cfg: TicketConfig, guildName: string): APIEmbed {
  return new EmbedBuilder()
    .setTitle(cfg.panel_title)
    .setDescription(cfg.panel_description)
    .setColor(cfg.panel_color)
    .setFooter({ text: `${guildName} • Sistema de Tickets` })
    .toJSON();
}

export function buildPanelComponents(
  cfg: TicketConfig,
): APIActionRowComponent<APIMessageActionRowComponent>[] {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket:open:default")
      .setLabel(cfg.panel_button_label)
      .setEmoji(cfg.panel_button_emoji || "🎫")
      .setStyle(ButtonStyle.Primary),
  );
  return [row.toJSON()];
}

export function buildWelcomeEmbed(
  cfg: TicketConfig,
  ticketId: string,
  userId: string,
  supportRoleId: string | null,
): EmbedBuilder {
  const welcome = cfg.ticket_welcome_message
    .replace(/\{user\}/g, `<@${userId}>`)
    .replace(/\{staff\}/g, supportRoleId ? `<@&${supportRoleId}>` : "equipe");

  return new EmbedBuilder()
    .setColor(cfg.panel_color)
    .setTitle("🎫 Ticket aberto")
    .setDescription(welcome)
    .addFields({ name: "ID", value: `\`${ticketId.slice(0, 8)}\``, inline: true })
    .setTimestamp(new Date());
}

export function buildTicketActions(canClose: boolean): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();
  if (canClose) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("ticket:close")
        .setLabel("Fechar")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger),
    );
  }
  row.addComponents(
    new ButtonBuilder()
      .setCustomId("ticket:claim")
      .setLabel("Assumir")
      .setEmoji("✋")
      .setStyle(ButtonStyle.Secondary),
  );
  return row;
}

export function buildClosedEmbed(closeMessage: string, staffId: string, color: number) {
  const desc = closeMessage.replace(/\{staff\}/g, `<@${staffId}>`);
  return new EmbedBuilder()
    .setColor(color)
    .setTitle("🔒 Ticket fechado")
    .setDescription(desc)
    .setTimestamp(new Date());
}

export function buildLogEmbed(opts: {
  title: string;
  color: number;
  fields: { name: string; value: string; inline?: boolean }[];
}) {
  return new EmbedBuilder()
    .setColor(opts.color)
    .setTitle(opts.title)
    .addFields(opts.fields.map((f) => ({ name: f.name, value: f.value, inline: f.inline ?? true })))
    .setTimestamp(new Date());
}
