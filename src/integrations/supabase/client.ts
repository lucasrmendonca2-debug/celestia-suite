// This file was auto-generated but patched to fail-soft when env vars are
// missing — the app does not currently use Supabase Auth in the browser
// (auth uses Discord OAuth via a server-side session cookie), and the only
// caller of this client is the global `attachSupabaseAuth` middleware,
// which is happy to attach "no token" when no session exists.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

type Client = SupabaseClient<Database>;

function readEnv(name: 'SUPABASE_URL' | 'SUPABASE_PUBLISHABLE_KEY'): string | undefined {
  const viteName = `VITE_${name}` as const;
  const fromVite = (import.meta as { env?: Record<string, string | undefined> }).env?.[viteName];
  if (fromVite) return fromVite;
  if (typeof process !== 'undefined' && process.env) return process.env[name];
  return undefined;
}

function createSupabaseClient(): Client | null {
  const SUPABASE_URL = readEnv('SUPABASE_URL');
  const SUPABASE_PUBLISHABLE_KEY = readEnv('SUPABASE_PUBLISHABLE_KEY');

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ['SUPABASE_PUBLISHABLE_KEY'] : []),
    ];
    console.warn(
      `[Supabase] env ausente (${missing.join(', ')}). Operando em modo degradado.`,
    );
    return null;
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: Client | null | undefined;

// Stub usado quando env está ausente — devolve o shape mínimo esperado pelo
// attachSupabaseAuth middleware (sessão nula) sem derrubar a página.
const SAFE_STUB = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({ error: null }),
  },
} as unknown as Client;

function resolveClient(): Client {
  if (_supabase === undefined) _supabase = createSupabaseClient();
  return _supabase ?? SAFE_STUB;
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as Client, {
  get(_, prop, receiver) {
    return Reflect.get(resolveClient(), prop, receiver);
  },
});
