import { randomBytes } from "node:crypto";
import { supabase } from "../../../database/supabase.js";
import type { PremiumActivationCode, PremiumType } from "./premium.types.js";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem caracteres ambíguos

function segment(len: number): string {
  const buf = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[buf[i] % ALPHABET.length];
  return out;
}

export function generateCode(): string {
  return `PREMIUM-${segment(4)}-${segment(4)}`;
}

export async function createCode(args: {
  planId: string;
  type: PremiumType;
  maxUses?: number;
  expiresAt?: Date | null;
  durationDays?: number | null;
  createdBy?: string | null;
  notes?: string | null;
}): Promise<PremiumActivationCode> {
  // tenta gerar código único (até 5 vezes)
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from("premium_activation_codes")
      .insert({
        code,
        plan_id: args.planId,
        type: args.type,
        max_uses: args.maxUses ?? 1,
        expires_at: args.expiresAt?.toISOString() ?? null,
        duration_days: args.durationDays ?? null,
        created_by: args.createdBy ?? null,
        notes: args.notes ?? null,
      })
      .select("*")
      .maybeSingle();
    if (!error && data) return data as PremiumActivationCode;
    if (error && !String(error.message).includes("duplicate")) throw new Error(error.message);
  }
  throw new Error("Falha ao gerar código único.");
}

export async function findCode(code: string): Promise<PremiumActivationCode | null> {
  const normalized = code.trim().toUpperCase();
  const { data } = await supabase
    .from("premium_activation_codes")
    .select("*")
    .eq("code", normalized)
    .maybeSingle();
  return (data as PremiumActivationCode | null) ?? null;
}

export type CodeValidationResult =
  | { ok: true; code: PremiumActivationCode }
  | { ok: false; reason: "not_found" | "inactive" | "expired" | "exhausted" };

export function validateCode(code: PremiumActivationCode | null): CodeValidationResult {
  if (!code) return { ok: false, reason: "not_found" };
  if (!code.active) return { ok: false, reason: "inactive" };
  if (code.expires_at && new Date(code.expires_at) < new Date()) return { ok: false, reason: "expired" };
  if (code.used_count >= code.max_uses) return { ok: false, reason: "exhausted" };
  return { ok: true, code };
}

export async function incrementCodeUsage(codeId: string) {
  // RPC-less increment: leitura + update; ok para escala média
  const { data: row } = await supabase
    .from("premium_activation_codes")
    .select("used_count")
    .eq("id", codeId)
    .maybeSingle();
  const current = (row?.used_count as number | undefined) ?? 0;
  await supabase.from("premium_activation_codes").update({ used_count: current + 1 }).eq("id", codeId);
}
