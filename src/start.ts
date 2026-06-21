import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    // best-effort: registrar no painel interno de erros
    try {
      const { logAppError } = await import("./lib/dev-logs/dev-logs.functions");
      const err = error as Error;
      await logAppError({
        data: {
          level: "error",
          source: "server",
          message: (err?.message ?? String(error)).slice(0, 2000),
          stack: (err?.stack ?? null)?.slice(0, 20000) ?? null,
        },
      });
    } catch {
      /* nunca quebrar a resposta de erro */
    }
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
