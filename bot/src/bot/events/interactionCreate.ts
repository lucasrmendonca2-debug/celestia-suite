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
import { isUserVip, isGuildPremium } from "../systems/premium/premium.check.js";
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

      if (interaction.isAutocomplete()) {
        const cmd = client.commands.get(interaction.commandName);
        if (cmd?.autocomplete) {
          try {
            await cmd.autocomplete(interaction, { client });
          } catch (err) {
            logger.debug({ err, cmd: interaction.commandName }, "autocomplete falhou");
            if (!interaction.responded) await interaction.respond([]).catch(() => {});
          }
        } else if (!interaction.responded) {
          await interaction.respond([]).catch(() => {});
        }
        return;
      }

      if (interaction.isButton()) {
        if (interaction.customId.startsWith("ticket:")) await handleTicketButton(interaction);
        else if (interaction.customId.startsWith("giveaway:")) await handleGiveawayButton(interaction);
        else if (interaction.customId.startsWith("poll:")) await handlePollButton(interaction);
        else if (interaction.customId.startsWith("suggestion:")) await handleSuggestionButton(interaction);
        // cosmetic:* buttons removidos — loja agora é só pelo site.
        else if (interaction.customId.startsWith("mission_claim:")) {
          const missionId = interaction.customId.split(":")[1];
          if (!missionId) return;
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
            flags: MessageFlags.Ephemeral,
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

      // Permissões por comando + cooldown + premium em paralelo.
      const cooldownPreemptive = cmd.cooldown && ix.guildId
        ? consumeCooldown(ix, cmd.data.name, cmd.cooldown)
        : Promise.resolve({ ok: true as const });

      // Só consulta premium se algum gate exigir (otimização para caminho quente).
      const needsVip = cmd.vipOnly === true;
      const needsPremiumGuild = cmd.premiumGuildOnly === true;
      const vipPromise = needsVip ? isUserVip(ix.user.id) : Promise.resolve(false);
      const premiumGuildPromise = needsPremiumGuild && ix.guildId
        ? isGuildPremium(ix.guildId)
        : Promise.resolve(false);

      const [isVip, isPremiumGuild, cd] = await Promise.all([
        vipPromise,
        premiumGuildPromise,
        cooldownPreemptive,
      ]);

      // Gates declarativos no SlashCommand (vipOnly / premiumGuildOnly / staffOnly).
      const isStaff = member?.permissions.has("ManageGuild") ?? false;
      if (cmd.vipOnly && !isVip) {
        return denyWith(ix, "Esse comando é exclusivo para usuários VIP. Use `/vip beneficios` para saber mais.");
      }
      if (cmd.premiumGuildOnly && !isPremiumGuild) {
        return denyWith(ix, "Esse comando exige que o servidor tenha Premium ativo. Use `/premium beneficios`.");
      }
      if (cmd.staffOnly && !isStaff) {
        return denyWith(ix, "Esse comando é restrito à staff do servidor.");
      }

      const cmdPerm = await checkCommandPermission(ix, {
        member,
        channelId: ix.channelId,
        isStaff,
        isVip,
        isPremiumGuild,
      });

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
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
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

  // `interaction.update(...)` é atômico: ACK + edição na mesma chamada.
  // Mais robusto que deferUpdate+editReply em mensagens ephemeral.
  const send = async (view: { embeds: any[]; components: any[] }) => {
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.update(view);
      } else {
        await interaction.editReply(view);
      }
    } catch (err) {
      logger.error({ err, customId: (interaction as any).customId }, "help: update falhou");
    }
  };

  if (interaction.isButton() && interaction.customId === "help:home") {
    return send(renderHome(client));
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "help:select") {
    const value = interaction.values[0] as HelpCategoryKey;
    if (!HELP_CATEGORIES.some((c) => c.key === value)) return;
    return send(renderCategory(client, value, 0));
  }

  if (interaction.isButton() && interaction.customId.startsWith("help:nav:")) {
    const [, , cat, pageStr] = interaction.customId.split(":");
    if (!cat || !HELP_CATEGORIES.some((c) => c.key === cat)) return;
    const page = Number.parseInt(pageStr ?? "0", 10) || 0;
    return send(renderCategory(client, cat as HelpCategoryKey, page));
  }
}

export default event;
