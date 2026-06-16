import type { ChatInputCommandInteraction, GuildMember, User } from "discord.js";

/**
 * Validador reutilizável de alvos para comandos que recebem `usuario`.
 *
 * Não decide a punição — apenas classifica a relação entre quem chamou
 * e o alvo (self, bot, owner, hierarquia). Cada comando escolhe a resposta
 * apropriada usando `random-responses.ts`.
 */

export type TargetKind =
  | "ok"
  | "self"
  | "bot_self" // o próprio bot que está executando
  | "bot_other" // outro bot
  | "owner" // dono do servidor
  | "higher_than_invoker" // alvo tem cargo igual/maior que o invocador
  | "higher_than_me" // alvo tem cargo igual/maior que o bot
  | "not_in_guild";

export interface TargetCheck {
  ok: boolean;
  kind: TargetKind;
}

export interface TargetCheckOptions {
  /** Se true, retorna `self` quando o alvo é o próprio invocador. Default: true. */
  blockSelf?: boolean;
  /** Se true, retorna `bot_self`/`bot_other` quando o alvo é bot. Default: true. */
  blockBot?: boolean;
  /** Se true, checa hierarquia de cargos (precisa de GuildMember). Default: false. */
  checkHierarchy?: boolean;
  /** Se true, retorna `not_in_guild` se o alvo não estiver no servidor. Default: false. */
  requireInGuild?: boolean;
}

export function validateTarget(
  interaction: ChatInputCommandInteraction,
  target: User,
  targetMember: GuildMember | null,
  opts: TargetCheckOptions = {},
): TargetCheck {
  const { blockSelf = true, blockBot = true, checkHierarchy = false, requireInGuild = false } = opts;

  if (blockSelf && target.id === interaction.user.id) {
    return { ok: false, kind: "self" };
  }
  if (blockBot && target.bot) {
    return {
      ok: false,
      kind: target.id === interaction.client.user.id ? "bot_self" : "bot_other",
    };
  }
  if (requireInGuild && !targetMember) {
    return { ok: false, kind: "not_in_guild" };
  }
  if (checkHierarchy && targetMember && interaction.guild) {
    if (targetMember.id === interaction.guild.ownerId) {
      return { ok: false, kind: "owner" };
    }
    const invoker = interaction.member as GuildMember | null;
    if (invoker?.roles && "highest" in invoker.roles) {
      if (
        invoker.id !== interaction.guild.ownerId &&
        targetMember.roles.highest.position >= invoker.roles.highest.position
      ) {
        return { ok: false, kind: "higher_than_invoker" };
      }
    }
    const me = interaction.guild.members.me;
    if (me && targetMember.roles.highest.position >= me.roles.highest.position) {
      return { ok: false, kind: "higher_than_me" };
    }
  }
  return { ok: true, kind: "ok" };
}

/** Atalho para classificar apenas self/bot, sem hierarquia. */
export function classifyTarget(
  interaction: ChatInputCommandInteraction,
  target: User,
): "ok" | "self" | "bot_self" | "bot_other" {
  if (target.id === interaction.user.id) return "self";
  if (target.bot) {
    return target.id === interaction.client.user.id ? "bot_self" : "bot_other";
  }
  return "ok";
}
