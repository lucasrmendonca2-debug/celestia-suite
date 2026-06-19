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
import { checkCommandPermission } from "../guards/commandPermissions.js";
import { ensureGuild, ensureUser } from "../utils/guildCache.js";
import { handleTicketButton, handleTicketSelect } from "../systems/tickets/handlers.js";
import { handleGiveawayButton } from "../systems/giveaway/giveaway.js";
import { handlePollButton } from "../systems/polls/poll.service.js";
import { handleSuggestionButton } from "../systems/suggestions/suggestion.service.js";
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
        else if (interaction.customId.startsWith("poll:")) await handlePollButton(interaction);
        else if (interaction.customId.startsWith("suggestion:")) await handleSuggestionButton(interaction);
        else if (interaction.customId.startsWith("mission_claim:")) {
          const missionId = interaction.customId.split(":")[1];
          const { claimMission } = await import("../systems/economy/missions.js");
          const { brandEmbed } = await import("../utils/embed.js");
          const res = await claimMission(interaction.guildId!, interaction.user.id, missionId);
          await interaction.reply({
            embeds: [
              brandEmbed({
                kind: res.ok ? "success" : "error",
                title: res.ok ? `+${res.reward} coletado!` : "Falhou",
                description: res.reason,
              }),
            ],
            ephemeral: true,
          });
        }
        return;
      }

      if (interaction.isStringSelectMenu() && interaction.customId === "ticket:select") {
        await handleTicketSelect(interaction);
        return;
      }

      if (!interaction.isChatInputCommand()) return;

      const ix = interaction as ChatInputCommandInteraction;
      const cmd = client.commands.get(ix.commandName);
      if (!cmd) return;

      // Upserts em background (não bloqueia o caminho quente).
      if (ix.guild) ensureGuild(ix.guild);
      ensureUser(ix.user.id, ix.user.username);

      const perm = checkPermissions(ix, cmd);
      if (!perm.ok) return denyWith(ix, perm.reason ?? Msg.missingPerm("necessária"));

      // Usa cache do member primeiro; só faz fetch se realmente precisar (rápido).
      const cachedMember = ix.guild && ix.member
        ? ix.guild.members.cache.get(ix.user.id) ?? null
        : null;
      const member = cachedMember
        ?? (ix.guild
          ? await ix.guild.members.fetch(ix.user.id).catch(() => null)
          : null);

      // Permissões por comando + cooldown em paralelo (eram serial).
      const cooldownPreemptive = cmd.cooldown && ix.guildId
        ? consumeCooldown(ix, cmd.data.name, cmd.cooldown)
        : Promise.resolve({ ok: true as const });
      const [cmdPerm, cd] = await Promise.all([
        checkCommandPermission(ix, {
          member,
          channelId: ix.channelId,
          isStaff: member?.permissions.has("ManageGuild") ?? false,
          isVip: false, // TODO: integrar com sistema VIP no Pass D
          isPremiumGuild: false, // TODO: integrar com premium_guild_config
        }),
        cooldownPreemptive,
      ]);

      if (!cmdPerm.ok) return denyWith(ix, cmdPerm.reason);

      // Se houve override de cooldown e o original (já cobrado) era diferente, aplicamos o override por cima.
      if (cmdPerm.cooldownOverride && cmdPerm.cooldownOverride !== cmd.cooldown && ix.guildId) {
        const cd2 = await consumeCooldown(ix, cmd.data.name, cmdPerm.cooldownOverride);
        if (!cd2.ok) {
          const seconds = Math.ceil((cd2.remainingMs ?? 0) / 1000);
          return denyWith(ix, Msg.cooldown(seconds));
        }
      } else if (!cd.ok) {
        const seconds = Math.ceil((cd.remainingMs ?? 0) / 1000);
        return denyWith(ix, Msg.cooldown(seconds));
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
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  // ACK rápido — evita "Interação falhou" (3s do Discord) mesmo se houver delay no render.
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate();
    }
  } catch (err) {
    logger.warn({ err }, "help: deferUpdate falhou (provavelmente já expirou)");
    return;
  }

  try {
    if (interaction.isButton() && interaction.customId === "help:home") {
      await interaction.editReply(renderHome(client));
      return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === "help:select") {
      const value = interaction.values[0] as HelpCategoryKey;
      if (!HELP_CATEGORIES.some((c) => c.key === value)) return;
      await interaction.editReply(renderCategory(client, value, 0));
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith("help:nav:")) {
      const [, , cat, pageStr] = interaction.customId.split(":");
      if (!cat || !HELP_CATEGORIES.some((c) => c.key === cat)) return;
      const page = Number.parseInt(pageStr ?? "0", 10) || 0;
      await interaction.editReply(renderCategory(client, cat as HelpCategoryKey, page));
      return;
    }
  } catch (err) {
    logger.error({ err, customId: (interaction as any).customId }, "help: editReply falhou");
  }
}

export default event;
