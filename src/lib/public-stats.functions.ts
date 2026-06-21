import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import commandsJson from "@/data/commands.json";

export interface PublicStats {
  servers: number;
  members: number;
  commands: number;
  lastHeartbeat: string | null;
  online: boolean;
}

function serverClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const getPublicStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicStats> => {
    const supabase = serverClient();
    const commands = (commandsJson as unknown as unknown[]).length;
    if (!supabase) {
      return { servers: 0, members: 0, commands, lastHeartbeat: null, online: false };
    }
    const { data } = await supabase.rpc("get_public_stats").maybeSingle();
    const last = data?.last_heartbeat ?? null;
    const online = last ? Date.now() - new Date(last).getTime() < 5 * 60_000 : false;
    return {
      servers: Number(data?.servers_present ?? 0),
      members: Number(data?.total_members ?? 0),
      commands,
      lastHeartbeat: last,
      online,
    };
  },
);
