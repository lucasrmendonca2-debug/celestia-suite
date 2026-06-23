/**
 * Favoritos de cosméticos. Lê o user da sessão Discord (mesmo padrão de profile.functions.ts).
 */
import { createServerFn } from "@tanstack/react-start";
import { getCurrentUser } from "@/lib/auth/auth.functions";
import { supabaseAdmin } from "@/lib/supabase-admin.server";

async function requireSessionUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("not_authenticated");
  return user;
}

export const toggleFavorite = createServerFn({ method: "POST" })
  .inputValidator((input: { cosmeticId: string }) => input)
  .handler(async ({ data }) => {
    const user = await requireSessionUser();

    const { data: existing } = await supabaseAdmin
      .from("user_favorite_cosmetics" as never)
      .select("user_id")
      .eq("user_id", user.id)
      .eq("cosmetic_id", data.cosmeticId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin
        .from("user_favorite_cosmetics" as never)
        .delete()
        .eq("user_id", user.id)
        .eq("cosmetic_id", data.cosmeticId);
      if (error) throw new Error(error.message);
      return { ok: true as const, favorited: false };
    }

    const { error } = await supabaseAdmin
      .from("user_favorite_cosmetics" as never)
      .insert({ user_id: user.id, cosmetic_id: data.cosmeticId });
    if (error) throw new Error(error.message);
    return { ok: true as const, favorited: true };
  });

export const listFavorites = createServerFn({ method: "GET" }).handler(async (): Promise<string[]> => {
  const user = await requireSessionUser();
  const { data, error } = await supabaseAdmin
    .from("user_favorite_cosmetics" as never)
    .select("cosmetic_id")
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<{ cosmetic_id: string }>).map((r) => r.cosmetic_id);
});
