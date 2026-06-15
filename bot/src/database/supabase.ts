import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

/**
 * Supabase client com service role — bypassa RLS.
 * Use APENAS no servidor do bot (que é confiável).
 */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
