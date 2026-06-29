/**
 * Cron endpoint — Rotação diária de cosméticos.
 * Chamado por pg_cron 1x por dia (00:05 UTC).
 *
 * Sem auth pesada: `/api/public/*` já é público por design,
 * mas validamos o apikey do Supabase pra evitar abuso.
 */
import { createFileRoute } from "@tanstack/react-router";
import { isAuthorizedCron } from "@/lib/cron/auth.server";

export const Route = createFileRoute("/api/public/cron/cosmetic-rotation")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthorizedCron(request)) {
          return new Response("unauthorized", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("rotate_daily_cosmetics", { _force: false });
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
