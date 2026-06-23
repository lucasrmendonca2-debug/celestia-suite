/**
 * Cooldowns repository — substitui o uso do shim Mongoose para a tabela
 * `cooldowns` (P9 / fase 1).
 *
 * Mantém a mesma semântica do shim:
 *  - findActive(): retorna o cooldown ativo (não expirado) ou null.
 *  - upsert(): grava o novo `expires_at` (UPSERT atômico via ON CONFLICT).
 *
 * Vantagens sobre o shim:
 *  - Sem read-modify-write: a gravação é um único UPSERT.
 *  - Tipos explícitos (`CooldownRow`).
 *  - Nenhuma dependência do `models.ts`.
 */
import { supabase } from "../../database/supabase.js";
import { logger } from "../utils/logger.js";

export interface CooldownRow {
  guildId: string;
  userId: string;
  command: string;
  expiresAt: Date;
}

interface DbRow {
  guild_id: string;
  user_id: string;
  command: string;
  expires_at: string;
}

function fromRow(row: DbRow): CooldownRow {
  return {
    guildId: row.guild_id,
    userId: row.user_id,
    command: row.command,
    expiresAt: new Date(row.expires_at),
  };
}

export async function findActiveCooldown(
  guildId: string,
  userId: string,
  command: string,
  now: Date = new Date(),
): Promise<CooldownRow | null> {
  const { data, error } = await supabase
    .from("cooldowns")
    .select("guild_id, user_id, command, expires_at")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .eq("command", command)
    .gt("expires_at", now.toISOString())
    .maybeSingle();

  if (error) {
    logger.warn({ err: error, guildId, userId, command }, "cooldownsRepo.findActive falhou");
    return null;
  }
  return data ? fromRow(data as DbRow) : null;
}

export async function upsertCooldown(
  guildId: string,
  userId: string,
  command: string,
  expiresAt: Date,
): Promise<void> {
  const { error } = await supabase
    .from("cooldowns")
    .upsert(
      {
        guild_id: guildId,
        user_id: userId,
        command,
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "guild_id,user_id,command" },
    );

  if (error) {
    logger.warn({ err: error, guildId, userId, command }, "cooldownsRepo.upsert falhou");
  }
}
