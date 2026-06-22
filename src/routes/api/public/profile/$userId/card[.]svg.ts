/**
 * GET /api/public/profile/:userId/card.svg
 * Endpoint público que renderiza o Profile Card como SVG.
 * Usado pelo bot Discord no embed do /perfil.
 */
import { createFileRoute } from "@tanstack/react-router";

const SNOWFLAKE_RE = /^\d{17,20}$/;

export const Route = createFileRoute("/api/public/profile/$userId/card.svg")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const userId = params.userId;

        if (!SNOWFLAKE_RE.test(userId)) {
          const { buildFallbackSvg } = await import("@/lib/profile/card-svg.server");
          return new Response(buildFallbackSvg("ID inválido"), {
            status: 400,
            headers: {
              "Content-Type": "image/svg+xml; charset=utf-8",
              "Cache-Control": "public, max-age=60",
            },
          });
        }

        try {
          const [{ loadProfileCardData }, { buildProfileCardSvg }] = await Promise.all([
            import("@/lib/profile/card-data.server"),
            import("@/lib/profile/card-svg.server"),
          ]);
          const data = await loadProfileCardData(userId);
          const svg = buildProfileCardSvg(data);
          return new Response(svg, {
            status: 200,
            headers: {
              "Content-Type": "image/svg+xml; charset=utf-8",
              "Cache-Control": "public, max-age=300, s-maxage=300",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (err) {
          console.error("[profile-card] error", err);
          const { buildFallbackSvg } = await import("@/lib/profile/card-svg.server");
          return new Response(buildFallbackSvg("Falha ao gerar card"), {
            status: 500,
            headers: {
              "Content-Type": "image/svg+xml; charset=utf-8",
              "Cache-Control": "no-store",
            },
          });
        }
      },
    },
  },
});
