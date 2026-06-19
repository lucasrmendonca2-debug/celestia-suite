import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { env } from "../config/env.js";

/**
 * Cliente do backend. Usa service_role quando existe; senão usa a chave pública
 * para leituras permitidas por RLS e mantém fallbacks no bot.
 */
function makeStub(): SupabaseClient {
  const handler: ProxyHandler<object> = {
    get() {
      throw new Error("Supabase não configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes).");
    },
  };
  return new Proxy({}, handler) as unknown as SupabaseClient;
}

function readJwtRole(key?: string): string | null {
  try {
    const payload = key?.split(".")[1];
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).role ?? null;
  } catch {
    return null;
  }
}

const supabaseKey =
  env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_ANON_KEY ||
  env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";

export const supabaseKeyRole = readJwtRole(supabaseKey);
export const canWriteSupabase = supabaseKeyRole === "service_role";

export const supabase: SupabaseClient =
  env.SUPABASE_URL && supabaseKey
    ? createClient(env.SUPABASE_URL, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: {
          transport: WebSocket as unknown as typeof globalThis.WebSocket,
          params: { eventsPerSecond: 1 },
        },
      })
    : makeStub();
