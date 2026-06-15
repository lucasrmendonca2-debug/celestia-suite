import {
  ChatInputCommandInteraction,
  Interaction,
  MessageFlags,
} from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { logger } from "../utils/logger.js";
import { brandEmbed } from "../utils/embed.js";
import { checkPermissions, denyWith } from "../guards/permissions.js";
import { consumeCooldown } from "../guards/cooldown.js";
import { ensureGuild, ensureUser } from "../utils/guildCache.js";
import { handleTicketButton } from "../systems/tickets/handlers.js";
import { handleGiveawayButton } from "../systems/giveaway/giveaway.js";

const event: BotEvent<"interactionCreate"> = {
  name: "interactionCreate",
  async execute(client, interaction: Interaction) {
    try {
      if (interaction.isButton()) {
        if (interaction.customId.startsWith("ticket:")) await handleTicketButton(interaction);
        else if (interaction.customId.startsWith("giveaway:")) await handleGiveawayButton(interaction);
        return;
      }

      if (!interaction.isChatInputCommand()) return;

      const ix = interaction as ChatInputCommandInteraction;
      const cmd = client.commands.get(ix.commandName);
      if (!cmd) return;

      // Hidratação básica
      if (ix.guild) await ensureGuild(ix.guild).catch(() => {});
      await ensureUser(ix.user.id, ix.user.username).catch(() => {});

      const perm = checkPermissions(ix, cmd);
      if (!perm.ok) return denyWith(ix, perm.reason ?? "Sem permissão.");

      if (cmd.cooldown && ix.guildId) {
        const cd = await consumeCooldown(ix, cmd.data.name, cmd.cooldown);
        if (!cd.ok) {
          const seconds = Math.ceil((cd.remainingMs ?? 0) / 1000);
          return denyWith(ix, `Aguarde **${seconds}s** para usar este comando novamente.`);
        }
      }

      await cmd.execute(ix, { client });
    } catch (err) {
      logger.error({ err }, "Erro em interactionCreate");
      if (interaction.isRepliable()) {
        const embed = brandEmbed({
          kind: "error",
          title: "Algo deu errado",
          description: "Não consegui processar essa interação. Tente novamente em instantes.",
        });
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral }).catch(() => {});
        } else {
          await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
        }
      }
    }
  },
};

export default event;
