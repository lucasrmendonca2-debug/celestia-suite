/**
 * Server-side Supabase client com **service role obrigatório**.
 *
 * Fallback histórico para a publishable key foi removido em prol da segurança
 * (ver auditoria P0-3): caller que usa `supabaseAdmin` assume bypass de RLS.
 * Se a env não existe, qualquer leitura/escrita falha cedo com mensagem clara,
 * em vez de rodar silenciosamente como `anon` e produzir comportamento errado.
 *
 * Para leituras públicas (com policy `TO anon`), criar um client local com
 * `createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)` dentro do handler.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

let _client: SupabaseClient<Database> | undefined;

function build(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    const missing = [
      ...(!url ? ["SUPABASE_URL"] : []),
      ...(!serviceKey ? ["SUPABASE_SERVICE_ROLE_KEY"] : []),
    ];
    throw new Error(
      `supabaseAdmin requer ${missing.join(" e ")}. Para leituras públicas use createClient com SUPABASE_PUBLISHABLE_KEY dentro do handler.`,
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop, receiver) {
    if (!_client) _client = build();
    return Reflect.get(_client, prop, receiver);
  },
});
