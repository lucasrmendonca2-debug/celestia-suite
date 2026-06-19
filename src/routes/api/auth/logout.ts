/**
 * POST /api/auth/logout — limpa a sessão e redireciona.
 * Aceita GET também pra link direto.
 *
 */
import { createFileRoute } from "@tanstack/react-router";
import { setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";

async function clear() {
  const { getSession } = await import("@/lib/auth/session.server");
  const session = await getSession();
  await session.clear();
}

function redirectHome() {
  setResponseStatus(302);
  setResponseHeader("Location", "/");
  setResponseHeader("Cache-Control", "no-store");
  return "Redirecting...";
}

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      GET: async () => {
        await clear();
        return redirectHome();
      },
      POST: async () => {
        await clear();
        return redirectHome();
      },
    },
  },
});
