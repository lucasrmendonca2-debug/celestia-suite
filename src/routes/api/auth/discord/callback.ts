/**
 * GET /api/auth/discord/callback?code=...&state=...
 * Troca o code por access_token, busca /users/@me e cria sessão.
 *
 * IMPORTANTE: o redirect final usa setResponseStatus/Header do runtime do
 * TanStack Start (não `new Response(...)`) para garantir que o Set-Cookie
 * gerado por session.update() seja mesclado na resposta. Quando devolvemos
 * `new Response(null, { headers: { Location } })`, as headers do contexto
 * (incluindo Set-Cookie) eram descartadas, então o cookie zenox_session
 * nunca persistia e o /dashboard bounce-ava pro /login.
 */
import { createFileRoute } from "@tanstack/react-router";
import { setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";

function htmlError(message: string, status: number) {
  const html = `<!doctype html><meta charset="utf-8"><title>Erro de login</title>
    <style>body{font-family:system-ui;background:#0b0b10;color:#e7e7ea;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}
    .card{max-width:480px;border:1px solid #2a2a35;background:#15151c;border-radius:12px;padding:24px}
    a{color:#8aa9ff}</style>
    <div class="card"><h1 style="margin-top:0">Não foi possível entrar</h1>
    <p>${message}</p><p><a href="/login">Tentar de novo</a></p></div>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export const Route = createFileRoute("/api/auth/discord/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (!code || !state) {
          return htmlError("Faltam parâmetros <code>code</code>/<code>state</code> na URL.", 400);
        }

        const { exchangeCode, fetchDiscordUser, makeDiscordCallbackUri, verifyOAuthState } = await import("@/lib/auth/discord.server");
        const { getSession } = await import("@/lib/auth/session.server");

        const session = await getSession();
        if (!verifyOAuthState(state)) {
          return htmlError("State inválido ou expirado (mais de 10min). Faça login de novo.", 400);
        }

        try {
          const redirectUri = session.data.oauthRedirectUri || makeDiscordCallbackUri(request);
          const token = await exchangeCode(code, redirectUri);
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
          return htmlError(
            `Falha ao autenticar com o Discord. <br><small>${err instanceof Error ? err.message : String(err)}</small>`,
            502,
          );
        }

        setResponseStatus(302);
        setResponseHeader("Location", "/dashboard");
        setResponseHeader("Cache-Control", "no-store");
        return new Response(null);
      },
    },
  },
});
