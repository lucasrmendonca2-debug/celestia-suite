import { supabase } from "../../../database/supabase.js";

export type CaseAction =
  | "BAN"
  | "TEMP_BAN"
  | "UNBAN"
  | "KICK"
  | "MUTE"
  | "TEMP_MUTE"
  | "UNMUTE"
  | "WARN"
  | "REMOVEWARN"
  | "NOTE"
  | "CLEAR"
  | "LOCK"
  | "UNLOCK"
  | "SLOWMODE"
  | "PURGE"
  | "NICKNAME";

export type CaseSource = "BOT" | "DISCORD_UI" | "DASHBOARD" | "AUTOMOD";

export interface ModCase {
  id: string;
  guild_id: string;
  case_number: number;
  user_id: string;
  user_tag: string | null;
  moderator_id: string;
  moderator_tag: string | null;
  action: string;
  reason: string | null;
  duration_seconds: number | null;
  expires_at: string | null;
  active: boolean;
  source: CaseSource;
  severity: string | null;
  proof_url: string | null;
  edited_at: string | null;
  edited_by: string | null;
  created_at: string;
}

export interface CreateCaseArgs {
  guildId: string;
  userId: string;
  userTag?: string | null;
  moderatorId: string;
  moderatorTag?: string | null;
  action: CaseAction;
  reason?: string | null;
  durationSeconds?: number | null;
  expiresAt?: Date | null;
  source?: CaseSource;
  severity?: "LOW" | "MEDIUM" | "HIGH" | null;
  proofUrl?: string | null;
}

async function nextCaseNumber(guildId: string): Promise<number> {
  const { data, error } = await supabase
    .from("mod_cases")
    .select("case_number")
    .eq("guild_id", guildId)
    .order("case_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return ((data?.case_number as number | undefined) ?? 0) + 1;
}

export async function createCase(args: CreateCaseArgs): Promise<ModCase> {
  // Race-safe: tenta inserir e, em caso de colisão única, retenta com novo número.
  for (let attempt = 0; attempt < 3; attempt++) {
    const num = await nextCaseNumber(args.guildId);
    const { data, error } = await supabase
      .from("mod_cases")
      .insert({
        guild_id: args.guildId,
        case_number: num,
        user_id: args.userId,
        user_tag: args.userTag ?? null,
        moderator_id: args.moderatorId,
        moderator_tag: args.moderatorTag ?? null,
        action: args.action,
        reason: args.reason ?? null,
        duration_seconds: args.durationSeconds ?? null,
        expires_at: args.expiresAt?.toISOString() ?? null,
        active: true,
        source: args.source ?? "BOT",
        severity: args.severity ?? null,
        proof_url: args.proofUrl ?? null,
      })
      .select("*")
      .single();
    if (!error) return data as ModCase;
    if (!`${error.code ?? ""}`.includes("23505")) throw error;
  }
  throw new Error("Falha ao gerar case_number único");
}

export async function getCase(guildId: string, caseNumber: number): Promise<ModCase | null> {
  const { data, error } = await supabase
    .from("mod_cases")
    .select("*")
    .eq("guild_id", guildId)
    .eq("case_number", caseNumber)
    .maybeSingle();
  if (error) throw error;
  return data as ModCase | null;
}

export async function listUserCases(
  guildId: string,
  userId: string,
  limit = 25,
): Promise<ModCase[]> {
  const { data, error } = await supabase
    .from("mod_cases")
    .select("*")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .order("case_number", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ModCase[] | null) ?? [];
}

export async function editCaseReason(args: {
  guildId: string;
  caseNumber: number;
  reason: string;
  editorId: string;
}): Promise<ModCase | null> {
  const { data, error } = await supabase
    .from("mod_cases")
    .update({
      reason: args.reason,
      edited_at: new Date().toISOString(),
      edited_by: args.editorId,
    })
    .eq("guild_id", args.guildId)
    .eq("case_number", args.caseNumber)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data as ModCase | null;
}

export async function deactivateCase(guildId: string, caseNumber: number) {
  await supabase
    .from("mod_cases")
    .update({ active: false })
    .eq("guild_id", guildId)
    .eq("case_number", caseNumber);
}

export async function modStatsLast30Days(guildId: string) {
  const { data, error } = await supabase
    .from("moderation_stats_30d")
    .select("*")
    .eq("guild_id", guildId);
  if (error) throw error;
  return (data ?? []) as { moderator_id: string; action: string; total: number }[];
}
