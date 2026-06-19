/**
 * GET /api/auth/discord/login
 * Gera state CSRF, salva em cookie de sessão e redireciona pro Discord.
 *
 * IMPORTANTE: usamos setResponseStatus/Header do runtime do TanStack Start
 * em vez de `new Response(...)` para garantir que o Set-Cookie da sessão
 * seja mesclado na resposta final (senão o cookie zenox_session nunca chega
 * no navegador e a sessão fica perdida).
 */
import { createFileRoute } from "@tanstack/react-router";
import { setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";

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

        const url = buildAuthorizeUrl(state, redirectUri);
        setResponseStatus(302);
        setResponseHeader("Location", url);
        setResponseHeader("Cache-Control", "no-store");
        return new Response(null);
      },
    },
  },
});
