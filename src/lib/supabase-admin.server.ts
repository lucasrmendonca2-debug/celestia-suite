/**
 * Server-side Supabase client with graceful fallback.
 *
 * On Lovable Cloud production, SUPABASE_SERVICE_ROLE_KEY is not injected.
 * The auto-generated `client.server.ts` throws "Missing Supabase environment"
 * on first property access, which crashes SSR loaders and triggers the root
 * error boundary ("This page didn't load") on navigation.
 *
 * This wrapper exports the same `supabaseAdmin` symbol but falls back to the
 * publishable/anon key when service role is absent. With RLS configured on
 * dashboard tables for authenticated reads, this keeps the UI working — only
 * privileged admin writes (which legitimately require service role) will fail,
 * and only on the specific call that needs it.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

let _client: SupabaseClient<Database> | undefined;
let _warned = false;

function build(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const key = serviceKey ?? publishableKey;

  if (!url || !key) {
    const missing = [
      ...(!url ? ["SUPABASE_URL"] : []),
      ...(!key ? ["SUPABASE_SERVICE_ROLE_KEY or SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    throw new Error(`Missing Supabase environment variable(s): ${missing.join(", ")}.`);
  }

  if (!serviceKey && !_warned) {
    _warned = true;
    console.warn(
      "[supabase-admin] SUPABASE_SERVICE_ROLE_KEY not set — falling back to publishable key (RLS enforced).",
    );
  }

  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop, receiver) {
    if (!_client) _client = build();
    return Reflect.get(_client, prop, receiver);
  },
});
