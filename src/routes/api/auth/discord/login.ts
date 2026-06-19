import { createFileRoute, redirect } from "@tanstack/react-router";

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
        return redirect({
          href: url,
          statusCode: 302,
          headers: { "Cache-Control": "no-store" },
        });
      },
    },
  },
});
