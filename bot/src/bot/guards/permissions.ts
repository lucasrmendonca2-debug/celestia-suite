import {
  ChatInputCommandInteraction,
  GuildMember,
  PermissionResolvable,
  PermissionsBitField,
} from "discord.js";
import { env } from "../../config/env.js";
import type { SlashCommand } from "../../types/command.js";
import { brandEmbed } from "../utils/embed.js";

interface CheckResult {
  ok: boolean;
  reason?: string;
}

export function checkPermissions(
  interaction: ChatInputCommandInteraction,
  command: SlashCommand,
): CheckResult {
  if (command.ownerOnly && interaction.user.id !== env.BOT_OWNER_ID) {
    return { ok: false, reason: "Este comando é restrito ao dono do bot." };
  }

  if (command.guildOnly && !interaction.inGuild()) {
    return { ok: false, reason: "Este comando só funciona em servidores." };
  }

  if (command.userPermissions?.length) {
    const member = interaction.member as GuildMember | null;
    const perms = member?.permissions as PermissionsBitField | undefined;
    const missing = command.userPermissions.filter((p) => !perms?.has(p as PermissionResolvable));
    if (missing.length) {
      return {
        ok: false,
        reason: `Você precisa das permissões: \`${missing.join(", ")}\`.`,
      };
    }
  }

  if (command.botPermissions?.length && interaction.guild) {
    const me = interaction.guild.members.me;
    const missing = command.botPermissions.filter(
      (p) => !me?.permissions.has(p as PermissionResolvable),
    );
    if (missing.length) {
      return {
        ok: false,
        reason: `O bot precisa das permissões: \`${missing.join(", ")}\`.`,
      };
    }
  }

  return { ok: true };
}

export async function denyWith(
  interaction: ChatInputCommandInteraction,
  reason: string,
): Promise<void> {
  const embed = brandEmbed({
    kind: "error",
    title: "Acesso negado",
    description: reason,
  });
  if (interaction.deferred || interaction.replied) {
    await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
  } else {
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
}
