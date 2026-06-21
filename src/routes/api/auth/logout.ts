/**
 * POST /api/auth/logout — limpa a sessão e redireciona.
 *
 * GET é rejeitado para evitar CSRF via <img>/<a> em sites externos.
 * O botão "Sair" deve ser um <form method="post" action="/api/auth/logout">.
 */
import { createFileRoute } from "@tanstack/react-router";

async function clear() {
  const { getSession } = await import("@/lib/auth/session.server");
  const session = await getSession();
  await session.clear();
}

async function redirectHome() {
  const { createSessionClearCookie } = await import("@/lib/auth/session.server");
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Cache-Control": "no-store",
      "Set-Cookie": createSessionClearCookie(),
    },
  });
}

function isSameOrigin(req: Request): boolean {
  // Defesa em profundidade: aceitar apenas POSTs disparados do próprio site.
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site" && fetchSite !== "none") {
    return false;
  }
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");
  if (origin) {
    try {
      const o = new URL(origin);
      if (o.host !== host) return false;
    } catch {
      return false;
    }
  } else if (referer) {
    try {
      const r = new URL(referer);
      if (r.host !== host) return false;
    } catch {
      return false;
    }
  }
  return true;
}

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isSameOrigin(request)) {
          return new Response("Forbidden", { status: 403 });
        }
        await clear();
        return redirectHome();
      },
      GET: async () =>
        new Response("Method Not Allowed — use POST", {
          status: 405,
          headers: { Allow: "POST" },
        }),
    },
  },
});

