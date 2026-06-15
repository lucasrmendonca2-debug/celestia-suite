/**
 * GET /api/auth/discord/login
 * Gera state CSRF, salva em cookie de sessão e redireciona pro Discord.
 */
import { createFileRoute } from "@tanstack/react-router";

function callbackUri(request: Request): string {
  const url = new URL(request.url);
  return `${url.origin}/api/auth/discord/callback`;
}

export const Route = createFileRoute("/api/auth/discord/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { buildAuthorizeUrl } = await import("@/lib/auth/discord.server");
        const { getSession } = await import("@/lib/auth/session.server");

        const state = crypto.randomUUID().replace(/-/g, "");
        const session = await getSession();
        // Reaproveita o cookie de sessão pra guardar o state temporariamente.
        await session.update({ ...session.data, refreshToken: `oauth_state:${state}` });

        const url = buildAuthorizeUrl(callbackUri(request), state);
        return new Response(null, { status: 302, headers: { Location: url } });
      },
    },
  },
});
