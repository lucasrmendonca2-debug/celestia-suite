import { supabase } from "../../../database/supabase.js";
import { logger } from "../../utils/logger.js";
import { findCode, incrementCodeUsage, validateCode } from "./premium.codes.js";
import { logAudit } from "./premium.audit.js";
import type { PremiumPlan, PremiumSubscription, PremiumType } from "./premium.types.js";

export async function getPlan(planId: string): Promise<PremiumPlan | null> {
  const { data } = await supabase.from("premium_plans").select("*").eq("id", planId).maybeSingle();
  return (data as PremiumPlan | null) ?? null;
}

export async function getPlanBySlug(slug: string): Promise<PremiumPlan | null> {
  const { data } = await supabase.from("premium_plans").select("*").eq("slug", slug).maybeSingle();
  return (data as PremiumPlan | null) ?? null;
}

export async function listPlans(opts?: { type?: PremiumType; activeOnly?: boolean }): Promise<PremiumPlan[]> {
  let q = supabase.from("premium_plans").select("*").order("price", { ascending: true });
  if (opts?.type) q = q.eq("type", opts.type);
  if (opts?.activeOnly) q = q.eq("active", true);
  const { data } = await q;
  return (data as PremiumPlan[] | null) ?? [];
}

/** Assinatura ATIVA atual do usuário (qualquer guild — VIP é global). */
export async function getActiveUserSubscription(userId: string): Promise<PremiumSubscription | null> {
  const { data } = await supabase
    .from("premium_subscriptions")
    .select("*")
    .eq("type", "USER_VIP")
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .order("expires_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return (data as PremiumSubscription | null) ?? null;
}

export async function getActiveGuildSubscription(guildId: string): Promise<PremiumSubscription | null> {
  const { data } = await supabase
    .from("premium_subscriptions")
    .select("*")
    .eq("type", "GUILD_PREMIUM")
    .eq("guild_id", guildId)
    .eq("status", "ACTIVE")
    .order("expires_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return (data as PremiumSubscription | null) ?? null;
}

export async function listUserVipsInGuild(guildId: string): Promise<PremiumSubscription[]> {
  // VIPs de usuários são globais, mas listamos quem é VIP independente do guild.
  // Para limitar a membros do guild, o caller filtra com base nos membros.
  const _ = guildId;
  const { data } = await supabase
    .from("premium_subscriptions")
    .select("*")
    .eq("type", "USER_VIP")
    .eq("status", "ACTIVE");
  return (data as PremiumSubscription[] | null) ?? [];
}

function computeExpiresAt(durationDays: number | null | undefined): string | null {
  if (!durationDays || durationDays <= 0) return null;
  return new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
}

export async function grantSubscription(args: {
  planId: string;
  type: PremiumType;
  userId?: string | null;
  guildId?: string | null;
  durationDays?: number | null;
  createdBy?: string | null;
  source?: string;
  notes?: string | null;
}): Promise<PremiumSubscription> {
  const plan = await getPlan(args.planId);
  if (!plan) throw new Error("Plano não encontrado.");
  if (!plan.active) throw new Error("Plano inativo.");
  if (plan.type !== args.type) throw new Error("Tipo do plano não corresponde.");
  if (args.type === "USER_VIP" && !args.userId) throw new Error("userId obrigatório para USER_VIP.");
  if (args.type === "GUILD_PREMIUM" && !args.guildId) throw new Error("guildId obrigatório para GUILD_PREMIUM.");

  // Cancela assinaturas ativas duplicadas
  const dupQuery = supabase.from("premium_subscriptions").update({ status: "CANCELLED", cancelled_at: new Date().toISOString() }).eq("type", args.type).eq("status", "ACTIVE");
  if (args.userId) dupQuery.eq("user_id", args.userId);
  if (args.guildId) dupQuery.eq("guild_id", args.guildId);
  await dupQuery;

  const durationDays = args.durationDays ?? plan.duration_days ?? null;
  const { data, error } = await supabase
    .from("premium_subscriptions")
    .insert({
      type: args.type,
      plan_id: args.planId,
      user_id: args.userId ?? null,
      guild_id: args.guildId ?? null,
      status: "ACTIVE",
      starts_at: new Date().toISOString(),
      expires_at: computeExpiresAt(durationDays),
      created_by: args.createdBy ?? null,
      source: args.source ?? "manual",
      notes: args.notes ?? null,
    })
    .select("*")
    .maybeSingle();
  if (error || !data) throw new Error(error?.message ?? "Falha ao criar assinatura.");

  await logAudit({
    action: "subscription.grant",
    targetUserId: args.userId ?? null,
    targetGuildId: args.guildId ?? null,
    adminId: args.createdBy ?? null,
    planId: args.planId,
    details: { durationDays, source: args.source ?? "manual" },
  });

  return data as PremiumSubscription;
}

export async function revokeUserVip(userId: string, byId?: string | null) {
  await supabase
    .from("premium_subscriptions")
    .update({ status: "CANCELLED", cancelled_at: new Date().toISOString() })
    .eq("type", "USER_VIP")
    .eq("user_id", userId)
    .eq("status", "ACTIVE");
  await logAudit({ action: "subscription.revoke", targetUserId: userId, adminId: byId ?? null });
}

export async function revokeGuildPremium(guildId: string, byId?: string | null) {
  await supabase
    .from("premium_subscriptions")
    .update({ status: "CANCELLED", cancelled_at: new Date().toISOString() })
    .eq("type", "GUILD_PREMIUM")
    .eq("guild_id", guildId)
    .eq("status", "ACTIVE");
  await logAudit({ action: "subscription.revoke", targetGuildId: guildId, adminId: byId ?? null });
}

export type RedeemResult =
  | { ok: true; subscription: PremiumSubscription; plan: PremiumPlan }
  | { ok: false; reason: "not_found" | "inactive" | "expired" | "exhausted" | "plan_mismatch" | "missing_target" };

export async function redeemCode(args: {
  code: string;
  userId?: string | null;
  guildId?: string | null;
}): Promise<RedeemResult> {
  const found = await findCode(args.code);
  const validation = validateCode(found);
  if (!validation.ok) return { ok: false, reason: validation.reason };
  const code = validation.code;

  const plan = await getPlan(code.plan_id);
  if (!plan || !plan.active) return { ok: false, reason: "inactive" };
  if (plan.type !== code.type) return { ok: false, reason: "plan_mismatch" };

  // valida target compatível
  if (code.type === "USER_VIP" && !args.userId) return { ok: false, reason: "missing_target" };
  if (code.type === "GUILD_PREMIUM" && !args.guildId) return { ok: false, reason: "missing_target" };

  const durationDays = code.duration_days ?? plan.duration_days;

  try {
    const subscription = await grantSubscription({
      planId: plan.id,
      type: code.type,
      userId: code.type === "USER_VIP" ? args.userId : null,
      guildId: code.type === "GUILD_PREMIUM" ? args.guildId : null,
      durationDays,
      createdBy: args.userId ?? null,
      source: "code",
      notes: `code:${code.code}`,
    });

    await incrementCodeUsage(code.id);
    await supabase.from("premium_activations").insert({
      code_id: code.id,
      user_id: args.userId ?? null,
      guild_id: args.guildId ?? null,
      subscription_id: subscription.id,
    });
    await logAudit({
      action: "code.redeem",
      targetUserId: args.userId ?? null,
      targetGuildId: args.guildId ?? null,
      planId: plan.id,
      details: { codeId: code.id, codeMasked: code.code.slice(0, 12) + "***" },
    });
    return { ok: true, subscription, plan };
  } catch (err) {
    logger.error({ err, codeId: code.id }, "Falha ao resgatar código premium");
    return { ok: false, reason: "inactive" };
  }
}
