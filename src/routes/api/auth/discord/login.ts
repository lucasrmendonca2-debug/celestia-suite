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
        const { buildAuthorizeUrl, createOAuthState, makeDiscordCallbackUri } = await import("@/lib/auth/discord.server");
        const { getSession } = await import("@/lib/auth/session.server");

        const state = createOAuthState();
        const redirectUri = makeDiscordCallbackUri(request, requestUrl.searchParams.get("origin"));
        const session = await getSession();
        await session.update({ ...session.data, oauthRedirectUri: redirectUri });

        const url = buildAuthorizeUrl(state);
        return new Response(null, { status: 302, headers: { Location: url } });
      },
    },
  },
});
