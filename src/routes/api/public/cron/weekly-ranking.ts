/**
 * Cron endpoint — Snapshot semanal de rankings.
 * Chamado por pg_cron toda segunda 09:00 BRT (12:00 UTC).
 *
 * Para cada guild presente, gera o snapshot top-5 (XP, moeda, reputação)
 * da semana e grava em weekly_rankings. O bot lê esse snapshot e posta
 * o anúncio no canal configurado.
 */
import { createFileRoute } from "@tanstack/react-router";

async function isAuthorized(request: Request): Promise<boolean> {
  const apikey = request.headers.get("apikey");
  const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!apikey || !expected) return false;
  return apikey === expected;
}

export const Route = createFileRoute("/api/public/cron/weekly-ranking")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAuthorized(request))) {
          return new Response("unauthorized", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: guilds, error: gErr } = await supabaseAdmin
          .from("bot_guild_presence")
          .select("guild_id")
          .eq("present", true)
          .limit(5000);

        if (gErr) {
          return new Response(JSON.stringify({ ok: false, error: gErr.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        let success = 0;
        let failed = 0;
        for (const g of guilds ?? []) {
          const { error } = await supabaseAdmin.rpc("snapshot_weekly_ranking", { _guild_id: g.guild_id });
          if (error) failed++;
          else success++;
        }

        await supabaseAdmin.from("automation_events").insert({
          kind: "weekly_ranking_posted",
          payload: { success, failed, total: (guilds ?? []).length },
        });

        return new Response(JSON.stringify({ ok: true, success, failed }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
