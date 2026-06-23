import { supabase } from "../../../database/supabase.js";
import { logger } from "../../utils/logger.js";
import { logTx } from "./economy.tx.js";
import { EconomyAccount } from "../../../database/models.js";

export interface MissionRow {
  id: string;
  guild_id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: string; // ex: "daily", "work", "rob", "buy", "messages"
  goal: number;
  reward: number;
  active: boolean;
  sort_order: number;
}

export interface UserMissionRow {
  id: string;
  mission_id: string;
  progress: number;
  completed_at: string | null;
  claimed_at: string | null;
  period_start: string;
}

const DEFAULTS: Array<Omit<MissionRow, "id" | "guild_id">> = [
  { slug: "daily_claim", title: "Pegue sua diária", description: "Use /diario hoje.", kind: "daily", goal: 1, reward: 150, active: true, sort_order: 1 },
  { slug: "work_3", title: "Trabalhador", description: "Use /trabalhar 3 vezes.", kind: "work", goal: 3, reward: 250, active: true, sort_order: 2 },
  { slug: "spend_500", title: "Consumidor", description: "Gaste 500 na loja.", kind: "shop_spend", goal: 500, reward: 300, active: true, sort_order: 3 },
];

function todayPeriod(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Lê o fator de dificuldade adaptativa do usuário (1.0 = normal).
 * Quanto maior, mais difícil (e maior a recompensa).
 */
async function getDifficultyScore(guildId: string, userId: string): Promise<number> {
  const { data } = await supabase.rpc("get_user_mission_difficulty", {
    _user_id: userId,
    _guild_id: guildId,
  });
  const n = typeof data === "number" ? data : Number(data);
  return Number.isFinite(n) && n > 0 ? n : 1.0;
}

/** Aplica o fator adaptativo nos campos goal/reward. */
function applyDifficulty<T extends { goal: number; reward: number }>(m: T, score: number): T {
  return {
    ...m,
    goal: Math.max(1, Math.round(m.goal * score)),
    reward: Math.max(1, Math.round(m.reward * score)),
  };
}

async function ensureMissions(guildId: string): Promise<MissionRow[]> {
  const { data } = await supabase
    .from("economy_missions")
    .select("*")
    .eq("guild_id", guildId)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (data && data.length) return data as MissionRow[];

  await supabase.from("economy_missions").insert(
    DEFAULTS.map((m) => ({ ...m, guild_id: guildId })),
  );
  const { data: again } = await supabase
    .from("economy_missions")
    .select("*")
    .eq("guild_id", guildId)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (again as MissionRow[]) ?? [];
}

export async function listUserMissions(guildId: string, userId: string) {
  const [missions, score] = await Promise.all([
    ensureMissions(guildId),
    getDifficultyScore(guildId, userId),
  ]);
  if (!missions.length) return [];
  const period = todayPeriod();
  const { data: progress } = await supabase
    .from("user_missions")
    .select("id,mission_id,progress,completed_at,claimed_at,period_start")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .eq("period_start", period);
  const byMission = new Map<string, UserMissionRow>(
    ((progress as UserMissionRow[] | null) ?? []).map((p) => [p.mission_id, p]),
  );
  return missions.map((m) => ({
    mission: applyDifficulty(m, score),
    state: byMission.get(m.id) ?? null,
  }));
}

export async function incrementMissionProgress(
  guildId: string,
  userId: string,
  kind: string,
  by = 1,
): Promise<void> {
  try {
    const missions = await ensureMissions(guildId);
    const targets = missions.filter((m) => m.kind === kind && m.active);
    if (!targets.length) return;
    const period = todayPeriod();
    for (const m of targets) {
      const { data: existing } = await supabase
        .from("user_missions")
        .select("id,progress,completed_at")
        .eq("guild_id", guildId)
        .eq("user_id", userId)
        .eq("mission_id", m.id)
        .eq("period_start", period)
        .maybeSingle();
      const newProgress = (existing?.progress ?? 0) + by;
      const completed = newProgress >= m.goal;
      await supabase.from("user_missions").upsert(
        {
          id: existing?.id,
          guild_id: guildId,
          user_id: userId,
          mission_id: m.id,
          period_start: period,
          progress: newProgress,
          completed_at: completed ? existing?.completed_at ?? new Date().toISOString() : null,
        },
        { onConflict: "guild_id,user_id,mission_id,period_start" },
      );
    }
  } catch (err) {
    logger.debug({ err, kind }, "incrementMissionProgress falhou");
  }
}

export async function claimMission(
  guildId: string,
  userId: string,
  missionId: string,
): Promise<{ ok: boolean; reason?: string; reward?: number }> {
  const period = todayPeriod();
  const { data: mission } = await supabase
    .from("economy_missions")
    .select("id,reward,title,goal")
    .eq("id", missionId)
    .eq("guild_id", guildId)
    .maybeSingle();
  if (!mission) return { ok: false, reason: "Missão não encontrada." };

  const { data: state } = await supabase
    .from("user_missions")
    .select("id,progress,completed_at,claimed_at")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .eq("mission_id", missionId)
    .eq("period_start", period)
    .maybeSingle();

  if (!state || (state.progress ?? 0) < mission.goal) {
    return { ok: false, reason: "Missão ainda não concluída." };
  }
  if (state.claimed_at) return { ok: false, reason: "Recompensa já coletada." };

  // Paga via Mongo (carteira principal)
  await EconomyAccount.updateOne(
    { guildId, userId },
    { $inc: { wallet: mission.reward }, $setOnInsert: { guildId, userId } },
    { upsert: true },
  );
  await supabase
    .from("user_missions")
    .update({ claimed_at: new Date().toISOString() })
    .eq("id", state.id);
  await logTx({
    guildId,
    userId,
    kind: "mission_reward",
    amount: mission.reward,
    reason: `Missão: ${mission.title}`,
    metadata: { mission_id: missionId },
  });
  return { ok: true, reward: mission.reward };
}
