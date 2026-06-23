/**
 * Histórico de cosméticos adquiridos pelo usuário (loja, drop, level reward, etc).
 */
import { createServerFn } from "@tanstack/react-start";
import { getCurrentUser } from "@/lib/auth/auth.functions";
import { supabaseAdmin } from "@/lib/supabase-admin.server";

export interface PurchaseEntryDTO {
  id: string;
  acquired_at: string;
  source: string | null;
  price_paid: number | null;
  cosmetic: {
    id: string;
    name: string;
    type: string;
    rarity: string;
    image_url: string | null;
  };
}

export const getPurchaseHistory = createServerFn({ method: "GET" }).handler(
  async (): Promise<PurchaseEntryDTO[]> => {
    const user = await getCurrentUser();
    if (!user) throw new Error("not_authenticated");

    const { data, error } = await supabaseAdmin
      .from("user_cosmetics")
      .select("id, cosmetic_id, acquired_at, source, metadata")
      .eq("user_id", user.id)
      .order("acquired_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    const ids = (data ?? []).map((r) => r.cosmetic_id).filter(Boolean);
    if (ids.length === 0) return [];

    const { data: cos } = await supabaseAdmin
      .from("profile_cosmetics")
      .select("id, name, type, rarity, image_url")
      .in("id", ids);

    const cosMap = new Map((cos ?? []).map((c) => [c.id, c]));

    return (data ?? [])
      .map((row): PurchaseEntryDTO | null => {
        const c = cosMap.get(row.cosmetic_id);
        if (!c) return null;
        const meta = (row.metadata ?? {}) as { price_paid?: number };
        return {
          id: row.id,
          acquired_at: row.acquired_at,
          source: row.source,
          price_paid: typeof meta.price_paid === "number" ? meta.price_paid : null,
          cosmetic: c,
        };
      })
      .filter((x): x is PurchaseEntryDTO => x !== null);
  },
);
