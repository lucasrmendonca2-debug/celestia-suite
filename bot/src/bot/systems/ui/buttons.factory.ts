/**
 * Botões padronizados.
 * Use em vez de criar ButtonBuilder solto pra manter labels e estilos consistentes.
 */
import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";

export const btn = {
  save: (id = "save") =>
    new ButtonBuilder().setCustomId(id).setLabel("Salvar configuração").setStyle(ButtonStyle.Success).setEmoji("💾"),
  cancel: (id = "cancel") =>
    new ButtonBuilder().setCustomId(id).setLabel("Cancelar").setStyle(ButtonStyle.Secondary),
  confirm: (id = "confirm", label = "Confirmar") =>
    new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(ButtonStyle.Success).setEmoji("✅"),
  danger: (id: string, label: string) =>
    new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(ButtonStyle.Danger),

  // Tickets
  openTicket: (id = "ticket:open") =>
    new ButtonBuilder().setCustomId(id).setLabel("Abrir atendimento").setStyle(ButtonStyle.Primary).setEmoji("🎫"),
  closeTicket: (id = "ticket:close") =>
    new ButtonBuilder().setCustomId(id).setLabel("Fechar atendimento").setStyle(ButtonStyle.Danger).setEmoji("🔒"),
  assumeTicket: (id = "ticket:assume") =>
    new ButtonBuilder().setCustomId(id).setLabel("Assumir atendimento").setStyle(ButtonStyle.Secondary).setEmoji("🛠️"),
  rateTicket: (id = "ticket:rate") =>
    new ButtonBuilder().setCustomId(id).setLabel("Avaliar atendimento").setStyle(ButtonStyle.Secondary).setEmoji("⭐"),

  // Moderação
  viewHistory: (userId: string) =>
    new ButtonBuilder().setCustomId(`mod:history:${userId}`).setLabel("Ver histórico").setStyle(ButtonStyle.Secondary).setEmoji("📋"),
  revertCase: (caseId: number | string) =>
    new ButtonBuilder().setCustomId(`mod:revert:${caseId}`).setLabel("Reverter ação").setStyle(ButtonStyle.Danger).setEmoji("↩️"),

  // Premium
  upgradePremium: (url: string) =>
    new ButtonBuilder().setURL(url).setLabel("Fazer upgrade").setStyle(ButtonStyle.Link).setEmoji("💎"),

  // Dashboard link
  openDashboard: (url: string) =>
    new ButtonBuilder().setURL(url).setLabel("Abrir dashboard").setStyle(ButtonStyle.Link).setEmoji("⚙️"),
};

export function row(...buttons: ButtonBuilder[]): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
}
