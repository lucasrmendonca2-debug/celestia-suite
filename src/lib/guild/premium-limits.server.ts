/**
 * Helpers server-only para checar limites por plano (FREE vs Premium).
 * Importar SOMENTE dentro de `.handler()` de server functions.
 */
import { supabaseAdmin } from "@/lib/supabase-admin.server";

export const FREE_LIMITS: Record<string, number> = {
  "tickets.categories": 3,
  "shop.items": 10,
  "badges.custom": 5,
  "level.rewards": 5,
  "automations": 5,
};

async function getActiveGuildPlan(guildId: string) {
  const { data } = await supabaseAdmin
    .from("premium_subscriptions")
    .select("*, plan:premium_plans(*)")
    .eq("type", "GUILD_PREMIUM")
    .eq("guild_id", guildId)
    .eq("status", "ACTIVE")
    .order("expires_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  return data;
}

export async function getGuildLimit(guildId: string, key: string): Promise<number> {
  const sub = await getActiveGuildPlan(guildId);
  const limits = (sub?.plan as { limits?: Record<string, number> } | undefined)?.limits;
  const v = limits?.[key];
  if (typeof v === "number" && v > 0) return v;
  return FREE_LIMITS[key] ?? 0;
}

/**
 * Lança erro se exceder o limite. Use ANTES de inserir.
 * `tableCount` é uma função que retorna o total atual (para customização).
 */
export async function enforceGuildLimit(
  guildId: string,
  key: string,
  table: "ticket_categories" | "shop_items" | "badges" | "level_rewards",
): Promise<void> {
  const limit = await getGuildLimit(guildId, key);
  if (limit <= 0) return;
  const { count } = await supabaseAdmin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("guild_id", guildId);
  if ((count ?? 0) >= limit) {
    throw new Error(
      `Limite do plano atingido (${count}/${limit}) para "${key}". Faça upgrade do plano Premium para aumentar.`,
    );
  }
}
