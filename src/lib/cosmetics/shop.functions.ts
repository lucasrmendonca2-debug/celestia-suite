/**
 * Server functions públicas para a loja de cosméticos.
 * Read-only via publishable key (RLS permite anon SELECT no cosmetic_shop_view).
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const listShopCosmetics = createServerFn({ method: "GET" }).handler(async () => {
  const supa = publicClient();
  const { data, error } = await supa
    .from("cosmetic_shop_view")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getTodayRotation = createServerFn({ method: "GET" }).handler(async () => {
  const supa = publicClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supa
    .from("cosmetic_rotations")
    .select("*")
    .eq("rotation_date", today)
    .maybeSingle();
  return data;
});
