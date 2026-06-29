/**
 * Cron endpoint — Insight Engine semanal.
 * Detecta padrões de atividade, moderação, economia e Premium em cada servidor
 * e grava em guild_insights. Chamado segunda 08:00 BRT (11:00 UTC).
 */
import { createFileRoute } from "@tanstack/react-router";
import { isAuthorizedCron } from "@/lib/cron/auth.server";

export const Route = createFileRoute("/api/public/cron/guild-insights")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthorizedCron(request)) {
          return new Response("unauthorized", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: guilds } = await supabaseAdmin
          .from("bot_guild_presence")
          .select("guild_id, member_count")
          .eq("present", true)
          .limit(5000);

        let insights = 0;
        let milestones = 0;
        let tunings = 0;

        for (const g of guilds ?? []) {
          const { data: ins } = await supabaseAdmin.rpc("generate_guild_insights", { _guild_id: g.guild_id });
          if (ins && typeof ins === "object" && "created" in ins) {
            insights += Number((ins as { created: number }).created || 0);
          }

          const { data: ms } = await supabaseAdmin.rpc("detect_guild_milestones", {
            _guild_id: g.guild_id,
            _member_count: g.member_count ?? 0,
          });
          if (ms && typeof ms === "object" && "created" in ms) {
            milestones += Number((ms as { created: number }).created || 0);
          }

          const { data: tn } = await supabaseAdmin.rpc("tune_guild_economy", { _guild_id: g.guild_id });
          if (tn && typeof tn === "object" && "state" in tn && (tn as { state: string }).state !== "stable") {
            tunings += 1;
          }
        }

        await supabaseAdmin.from("automation_events").insert({
          kind: "insight_sent",
          payload: { insights, milestones, tunings, total: (guilds ?? []).length },
        });

        return new Response(JSON.stringify({ ok: true, insights, milestones, tunings }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
