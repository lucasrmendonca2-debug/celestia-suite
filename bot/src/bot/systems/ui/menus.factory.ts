/**
 * Menus padronizados (StringSelect).
 */
import { StringSelectMenuBuilder, ActionRowBuilder, type APISelectMenuOption } from "discord.js";

export const menu = {
  ticketCategories(
    customId: string,
    categories: { value: string; label: string; description?: string; emoji?: string }[],
  ): ActionRowBuilder<StringSelectMenuBuilder> {
    const options: APISelectMenuOption[] = categories.slice(0, 25).map((c) => ({
      label: c.label,
      value: c.value,
      description: c.description,
      emoji: c.emoji ? { name: c.emoji } : undefined,
    }));
    const m = new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder("Escolha o tipo de atendimento")
      .addOptions(options);
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(m);
  },
};
