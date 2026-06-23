/**
 * Hall da Fama — server fn pública (sem auth). Usa RPC SECURITY DEFINER `get_hall_of_fame`.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export interface HallEntryDTO {
  user_id: string;
  xp?: number;
  level?: number;
  coins?: number;
  rep?: number;
}

export interface HallOfFameDTO {
  season: { id: string; name: string; description: string | null; starts_at: string; ends_at: string | null } | null;
  top_xp: HallEntryDTO[];
  top_coins: HallEntryDTO[];
  top_rep: HallEntryDTO[];
  generated_at: string;
}

export const getHallOfFame = createServerFn({ method: "GET" }).handler(
  async (): Promise<HallOfFameDTO> => {
    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const key =
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("supabase_env_missing");

    const supabase = createClient(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.rpc("get_hall_of_fame");
    if (error) throw new Error(error.message);

    return (data ?? {
      season: null,
      top_xp: [],
      top_coins: [],
      top_rep: [],
      generated_at: new Date().toISOString(),
    }) as HallOfFameDTO;
  },
);
