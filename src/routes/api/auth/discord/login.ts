import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/discord/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const { buildAuthorizeUrl, createOAuthState, makeDiscordCallbackUri } = await import("@/lib/auth/discord.server");
        const { createSessionSetCookie, getSession } = await import("@/lib/auth/session.server");

        const state = createOAuthState();
        const redirectUri = makeDiscordCallbackUri(request, requestUrl.searchParams.get("origin"));
        const session = await getSession();

        const url = buildAuthorizeUrl(state, redirectUri);
        return new Response(null, {
          status: 302,
          headers: {
            Location: url,
            "Cache-Control": "no-store",
            "Set-Cookie": createSessionSetCookie({ ...session.data, oauthRedirectUri: redirectUri }),
          },
        });
      },
    },
  },
});
