/**
 * Server functions do Sistema Premium / VIP.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const guildIdSchema = z.string().regex(/^\d{5,32}$/, "guild id inválido");

async function admin() {
  const { supabaseAdmin } = await import("@/lib/supabase-admin.server");
  return supabaseAdmin;
}

async function perm(guildId: string) {
  const { assertCanManageGuild } = await import("./permissions.server");
  return assertCanManageGuild(guildId);
}

export const listPremiumPlans = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("premium_plans")
    .select("*")
    .eq("active", true)
    .order("price", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getGuildPremiumStatus = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => z.object({ guildId: guildIdSchema }).parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: subRow } = await sb
      .from("premium_subscriptions")
      .select("*, plan:premium_plans(*)")
      .eq("type", "GUILD_PREMIUM")
      .eq("guild_id", data.guildId)
      .eq("status", "ACTIVE")
      .order("expires_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    return { subscription: subRow ?? null };
  });

export const listPremiumAuditLogs = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => z.object({ guildId: guildIdSchema }).parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows } = await sb
      .from("premium_audit_log")
      .select("*")
      .eq("target_guild_id", data.guildId)
      .order("created_at", { ascending: false })
      .limit(50);
    return rows ?? [];
  });

const roleIdSchema = z.string().regex(/^\d{5,32}$/).nullable();

export const getPremiumGuildConfig = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => z.object({ guildId: guildIdSchema }).parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: row } = await sb
      .from("premium_guild_config")
      .select("*")
      .eq("guild_id", data.guildId)
      .maybeSingle();
    return row ?? { guild_id: data.guildId, vip_role_id: null, premium_role_id: null };
  });

export const updatePremiumGuildConfig = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        guildId: guildIdSchema,
        vip_role_id: roleIdSchema.optional(),
        premium_role_id: roleIdSchema.optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const payload = {
      guild_id: data.guildId,
      ...(data.vip_role_id !== undefined ? { vip_role_id: data.vip_role_id } : {}),
      ...(data.premium_role_id !== undefined ? { premium_role_id: data.premium_role_id } : {}),
    };
    const { data: row, error } = await sb
      .from("premium_guild_config")
      .upsert(payload, { onConflict: "guild_id" })
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

const RedeemInput = z.object({
  guildId: guildIdSchema,
  code: z.string().min(8).max(64),
});

export const redeemGuildCode = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RedeemInput.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const code = data.code.trim().toUpperCase();

    // RPC atômica (lock + validação + insert em uma única transação)
    const { data: result, error } = await sb.rpc("redeem_guild_premium_code", {
      _code: code,
      _guild_id: data.guildId,
    });

    if (error) throw new Error(error.message);

    const r = (result ?? {}) as {
      ok?: boolean;
      reason?: "not_found" | "inactive" | "expired" | "exhausted" | "plan_mismatch";
      subscription_id?: string;
      plan_id?: string;
    };

    if (!r.ok) {
      return { ok: false as const, reason: (r.reason ?? "not_found") as NonNullable<typeof r.reason> };
    }

    const [{ data: plan }, { data: sub }] = await Promise.all([
      sb.from("premium_plans").select("*").eq("id", r.plan_id!).maybeSingle(),
      sb.from("premium_subscriptions").select("*").eq("id", r.subscription_id!).maybeSingle(),
    ]);

    return { ok: true as const, plan, subscription: sub };
  });


/**
 * Snapshot do uso/benefícios premium da guild + VIP do usuário logado.
 * Retorna plano, multiplicadores efetivos e uso/limite atual.
 */
export const getPremiumUsage = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) => z.object({ guildId: guildIdSchema }).parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { FREE_LIMITS } = await import("./premium-limits.server");

    // plano da guild
    const { data: guildSub } = await sb
      .from("premium_subscriptions")
      .select("*, plan:premium_plans(*)")
      .eq("type", "GUILD_PREMIUM")
      .eq("guild_id", data.guildId)
      .eq("status", "ACTIVE")
      .order("expires_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    type PlanShape = { features?: Record<string, string | number | boolean | null>; limits?: Record<string, number>; name?: string };
    const guildPlan = (guildSub?.plan as unknown as PlanShape | null) ?? null;
    const guildLimits = guildPlan?.limits ?? {};
    const guildFeatures = guildPlan?.features ?? {};

    // VIP do user logado (global)
    const { getSession } = await import("@/lib/auth/session.server");
    const session = await getSession();
    const userId = session.data.userId ?? null;
    let userPlan: PlanShape | null = null;
    let userSubscription: { expires_at: string | null; status: string } | null = null;
    if (userId) {
      const { data: userSub } = await sb
        .from("premium_subscriptions")
        .select("*, plan:premium_plans(*)")
        .eq("type", "USER_VIP")
        .eq("user_id", userId)
        .eq("status", "ACTIVE")
        .order("expires_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      if (userSub && (!userSub.expires_at || new Date(userSub.expires_at) >= new Date())) {
        userPlan = (userSub.plan as unknown as PlanShape | null) ?? null;
        userSubscription = { expires_at: userSub.expires_at, status: userSub.status };
      }
    }

    const userFeatures = userPlan?.features ?? {};
    const pickNum = (obj: Record<string, string | number | boolean | null>, key: string): number => {
      const v = obj[key];
      return typeof v === "number" && v > 0 ? v : 1;
    };

    const multipliers = {
      xp: pickNum(userFeatures, "level.multiplier.xp"),
      daily: pickNum(userFeatures, "economy.multiplier.daily"),
      work: pickNum(userFeatures, "economy.multiplier.work"),
      crime: pickNum(userFeatures, "economy.multiplier.crime"),
    };

    // contagens atuais
    const tables: Array<{ key: string; table: "ticket_categories" | "shop_items" | "level_rewards" | "badges"; label: string }> = [
      { key: "tickets.categories", table: "ticket_categories", label: "Categorias de ticket" },
      { key: "shop.items", table: "shop_items", label: "Itens da loja" },
      { key: "level.rewards", table: "level_rewards", label: "Recompensas de nível" },
      { key: "badges.custom", table: "badges", label: "Badges" },
    ];

    const usage = await Promise.all(
      tables.map(async (t) => {
        const { count } = await sb.from(t.table).select("id", { count: "exact", head: true }).eq("guild_id", data.guildId);
        const planLimit = guildLimits[t.key];
        const limit = typeof planLimit === "number" && planLimit > 0 ? planLimit : (FREE_LIMITS[t.key] ?? 0);
        const used = count ?? 0;
        return {
          key: t.key,
          label: t.label,
          used,
          limit,
          remaining: Math.max(0, limit - used),
          pct: limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0,
        };
      }),
    );

    return {
      guild: guildSub
        ? {
            plan_name: guildPlan?.name ?? "Premium",
            expires_at: guildSub.expires_at,
            features: guildFeatures,
          }
        : null,
      user: userPlan
        ? {
            plan_name: userPlan.name ?? "VIP",
            expires_at: userSubscription?.expires_at ?? null,
          }
        : null,
      multipliers,
      usage,
    };
  });
