/**
 * Server functions do PAINEL ADMIN GLOBAL do Premium.
 * Acesso restrito ao BOT_OWNER_ID (mesma checagem do bot /admin-premium).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function admin() {
  const { supabaseAdmin } = await import("@/lib/supabase-admin.server");
  return supabaseAdmin;
}

async function requireOwner(): Promise<string> {
  const { getSession } = await import("@/lib/auth/session.server");
  const session = await getSession();
  const uid = session.data.userId;
  const ownerId = process.env.BOT_OWNER_ID;
  if (!uid || !ownerId || uid !== ownerId) {
    throw new Error("Acesso restrito ao owner.");
  }
  return uid;
}

export const adminPremiumOverview = createServerFn({ method: "GET" }).handler(async () => {
  await requireOwner();
  const sb = await admin();
  const [plans, subs, codes, audit] = await Promise.all([
    sb.from("premium_plans").select("*").order("price", { ascending: true }),
    sb
      .from("premium_subscriptions")
      .select("id,type,status,plan_id,user_id,guild_id,starts_at,expires_at,created_at")
      .eq("status", "ACTIVE"),
    sb.from("premium_activation_codes").select("id,code,type,active,used_count,max_uses,expires_at,created_at").order("created_at", { ascending: false }).limit(100),
    sb.from("premium_audit_log").select("*").order("created_at", { ascending: false }).limit(100),
  ]);

  const activeSubs = subs.data ?? [];
  return {
    plans: plans.data ?? [],
    metrics: {
      activeUserVips: activeSubs.filter((s) => s.type === "USER_VIP").length,
      activeGuildPremiums: activeSubs.filter((s) => s.type === "GUILD_PREMIUM").length,
      totalCodes: codes.data?.length ?? 0,
      activeCodes: codes.data?.filter((c) => c.active).length ?? 0,
    },
    subscriptions: activeSubs,
    codes: codes.data ?? [],
    audit: audit.data ?? [],
  };
});

const CreateCodeInput = z.object({
  planId: z.string().uuid(),
  type: z.enum(["USER_VIP", "GUILD_PREMIUM"]),
  maxUses: z.number().int().min(1).max(10_000).default(1),
  durationDays: z.number().int().min(1).max(3650).nullable().optional(),
  expiresInDays: z.number().int().min(1).max(3650).nullable().optional(),
  note: z.string().max(255).optional(),
});

function genCode(): string {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PREMIUM-${seg()}-${seg()}`;
}

export const adminCreateCode = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateCodeInput.parse(d))
  .handler(async ({ data }) => {
    const ownerId = await requireOwner();
    const sb = await admin();
    const code = genCode();
    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 86_400_000).toISOString()
      : null;
    const { data: row, error } = await sb
      .from("premium_activation_codes")
      .insert({
        code,
        plan_id: data.planId,
        type: data.type,
        max_uses: data.maxUses,
        used_count: 0,
        duration_days: data.durationDays ?? null,
        expires_at: expiresAt,
        active: true,
        created_by: ownerId,
        notes: data.note ?? null,
      })
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    await sb.from("premium_audit_log").insert({
      action: "code.create.dashboard",
      admin_id: ownerId,
      plan_id: data.planId,
      details: { codeId: row?.id, type: data.type, maxUses: data.maxUses },
    });
    return row;
  });

export const adminDeactivateCode = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const ownerId = await requireOwner();
    const sb = await admin();
    const { error } = await sb
      .from("premium_activation_codes")
      .update({ active: false })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await sb.from("premium_audit_log").insert({
      action: "code.deactivate.dashboard",
      admin_id: ownerId,
      details: { codeId: data.id },
    });
    return { ok: true };
  });

export const adminRevokeSubscription = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const ownerId = await requireOwner();
    const sb = await admin();
    const { data: sub } = await sb
      .from("premium_subscriptions")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!sub) throw new Error("Assinatura não encontrada.");
    const { error } = await sb
      .from("premium_subscriptions")
      .update({ status: "CANCELLED", cancelled_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await sb.from("premium_audit_log").insert({
      action: "subscription.revoke.dashboard",
      admin_id: ownerId,
      target_user_id: sub.user_id,
      target_guild_id: sub.guild_id,
      plan_id: sub.plan_id,
    });
    return { ok: true };
  });

export const isPremiumOwner = createServerFn({ method: "GET" }).handler(async () => {
  const { getSession } = await import("@/lib/auth/session.server");
  const session = await getSession();
  const uid = session.data.userId;
  const ownerId = process.env.BOT_OWNER_ID;
  return Boolean(uid && ownerId && uid === ownerId);
});
