import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { env } from "../config/env.js";

/**
 * Supabase client com service role — bypassa RLS.
 * Se SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não estiverem definidos,
 * exporta um stub que lança ao ser usado (evita crash no boot por falta
 * de WebSocket nativo no Node 20).
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

export const supabaseKeyRole = readJwtRole(env.SUPABASE_SERVICE_ROLE_KEY);
export const canWriteSupabase = supabaseKeyRole === "service_role";

export const supabase: SupabaseClient =
  env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: {
          transport: WebSocket as unknown as typeof globalThis.WebSocket,
          params: { eventsPerSecond: 1 },
        },
      })
    : makeStub();
