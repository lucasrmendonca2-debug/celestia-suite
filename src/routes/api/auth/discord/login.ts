import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/discord/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const { buildAuthorizeUrl, createOAuthState, makeDiscordCallbackUri, shouldIncludeDiscordRedirectUri } = await import("@/lib/auth/discord.server");
        const { createSessionSetCookie, getSession } = await import("@/lib/auth/session.server");

        const { state, nonce } = createOAuthState();
        const redirectUri = makeDiscordCallbackUri(request, requestUrl.searchParams.get("origin"));
        const oauthRedirectUri = shouldIncludeDiscordRedirectUri(redirectUri) ? redirectUri : undefined;
        const session = await getSession();

        const nextParam = requestUrl.searchParams.get("next");
        const postLoginRedirect =
          nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : undefined;

        const url = buildAuthorizeUrl(state, oauthRedirectUri);
        return new Response(null, {
          status: 302,
          headers: {
            Location: url,
            "Cache-Control": "no-store",
            "Set-Cookie": createSessionSetCookie({ ...session.data, oauthRedirectUri, oauthStateNonce: nonce, postLoginRedirect }),
          },
        });


      },
    },
  },
});
