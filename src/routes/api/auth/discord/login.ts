/**
 * GET /api/auth/discord/login
 * Gera state CSRF, salva em cookie de sessão e redireciona pro Discord.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/discord/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const { buildAuthorizeUrl, makeDiscordCallbackUri } = await import("@/lib/auth/discord.server");
        const { getSession } = await import("@/lib/auth/session.server");

        const state = crypto.randomUUID().replace(/-/g, "");
        const redirectUri = makeDiscordCallbackUri(request, requestUrl.searchParams.get("origin"));
        const session = await getSession();
        // Reaproveita o cookie de sessão pra guardar o state temporariamente.
        await session.update({ ...session.data, refreshToken: `oauth_state:${state}`, oauthRedirectUri: redirectUri });

        const url = buildAuthorizeUrl(redirectUri, state);
        return new Response(null, { status: 302, headers: { Location: url } });
      },
    },
  },
});
