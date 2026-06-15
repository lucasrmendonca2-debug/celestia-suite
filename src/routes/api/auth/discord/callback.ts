/**
 * GET /api/auth/discord/callback?code=...&state=...
 * Troca o code por access_token, busca /users/@me e cria sessão.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/discord/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (!code || !state) {
          return new Response("Faltam parâmetros code/state.", { status: 400 });
        }

        const { exchangeCode, fetchDiscordUser, makeDiscordCallbackUri } = await import("@/lib/auth/discord.server");
        const { getSession } = await import("@/lib/auth/session.server");

        const session = await getSession();
        const expected = session.data.refreshToken;
        if (!expected || expected !== `oauth_state:${state}`) {
          return new Response("State inválido. Tente fazer login de novo.", { status: 400 });
        }

        try {
          const token = await exchangeCode(code, session.data.oauthRedirectUri || makeDiscordCallbackUri(request));
          const user = await fetchDiscordUser(token.access_token);
          await session.update({
            userId: user.id,
            username: user.username,
            globalName: user.global_name,
            avatar: user.avatar,
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            oauthRedirectUri: undefined,
            expiresAt: Date.now() + token.expires_in * 1000,
          });
        } catch (err) {
          console.error("[discord/callback]", err);
          return new Response("Falha ao autenticar com o Discord.", { status: 502 });
        }

        return new Response(null, { status: 302, headers: { Location: "/dashboard" } });
      },
    },
  },
});
