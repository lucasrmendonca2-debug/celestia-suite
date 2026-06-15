import {
  ChatInputCommandInteraction,
  Interaction,
  MessageFlags,
} from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { logger } from "../utils/logger.js";
import { brandEmbed } from "../utils/embed.js";
import { Msg } from "../utils/messages.js";
import { checkPermissions, denyWith } from "../guards/permissions.js";
import { consumeCooldown } from "../guards/cooldown.js";
import { ensureGuild, ensureUser } from "../utils/guildCache.js";
import { handleTicketButton } from "../systems/tickets/handlers.js";
import { handleGiveawayButton } from "../systems/giveaway/giveaway.js";
import {
  HELP_CATEGORIES,
  renderCategory,
  renderHome,
  type HelpCategoryKey,
} from "../commands/utility/help.js";
import type { ZenoxClient } from "../../types/command.js";

const event: BotEvent<"interactionCreate"> = {
  name: "interactionCreate",
  async execute(client, interaction: Interaction) {
    try {
      // ---------- Help interativo ----------
      if (
        (interaction.isButton() || interaction.isStringSelectMenu()) &&
        interaction.customId.startsWith("help:")
      ) {
        return handleHelpInteraction(client, interaction);
      }

      if (interaction.isButton()) {
        if (interaction.customId.startsWith("ticket:")) await handleTicketButton(interaction);
        else if (interaction.customId.startsWith("giveaway:")) await handleGiveawayButton(interaction);
        return;
      }

      if (!interaction.isChatInputCommand()) return;

      const ix = interaction as ChatInputCommandInteraction;
      const cmd = client.commands.get(ix.commandName);
      if (!cmd) return;

      if (ix.guild) await ensureGuild(ix.guild).catch(() => {});
      await ensureUser(ix.user.id, ix.user.username).catch(() => {});

      const perm = checkPermissions(ix, cmd);
      if (!perm.ok) return denyWith(ix, perm.reason ?? Msg.missingPerm("necessária"));

      if (cmd.cooldown && ix.guildId) {
        const cd = await consumeCooldown(ix, cmd.data.name, cmd.cooldown);
        if (!cd.ok) {
          const seconds = Math.ceil((cd.remainingMs ?? 0) / 1000);
          return denyWith(ix, Msg.cooldown(seconds));
        }
      }

      await cmd.execute(ix, { client });
    } catch (err) {
      logger.error({ err, command: getCmdName(interaction) }, "Erro em interactionCreate");
      if (interaction.isRepliable()) {
        const embed = brandEmbed({
          kind: "error",
          title: "Algo deu errado",
          description: Msg.oops(),
        });
        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
          } else {
            await interaction.reply({ embeds: [embed], ephemeral: true });
          }
        } catch {
          /* engole — interaction provavelmente expirou */
        }
      }
    }
  },
};

function getCmdName(i: Interaction): string | undefined {
  if (i.isChatInputCommand()) return i.commandName;
  if (i.isButton() || i.isStringSelectMenu()) return `component:${i.customId}`;
  return undefined;
}

async function handleHelpInteraction(client: ZenoxClient, interaction: Interaction) {
  if (interaction.isButton() && interaction.customId === "help:home") {
    return interaction.update(renderHome(client));
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "help:select") {
    const value = interaction.values[0] as HelpCategoryKey;
    if (!HELP_CATEGORIES.some((c) => c.key === value)) return;
    return interaction.update(renderCategory(client, value, 0));
  }

  if (interaction.isButton() && interaction.customId.startsWith("help:nav:")) {
    const [, , cat, pageStr] = interaction.customId.split(":");
    if (!cat || !HELP_CATEGORIES.some((c) => c.key === cat)) return;
    const page = Number.parseInt(pageStr ?? "0", 10) || 0;
    return interaction.update(renderCategory(client, cat as HelpCategoryKey, page));
  }
}

export default event;
