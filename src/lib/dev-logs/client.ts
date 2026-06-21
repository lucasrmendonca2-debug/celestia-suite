/**
 * Captura global de erros no cliente e envio (debounced + dedup local)
 * para o backend via logAppError.
 */
import { logAppError } from "./dev-logs.functions";

const RECENT = new Map<string, number>();
const DEDUP_WINDOW_MS = 10_000;

function shouldSend(key: string): boolean {
  const now = Date.now();
  const last = RECENT.get(key);
  // clean
  if (RECENT.size > 200) {
    for (const [k, t] of RECENT) if (now - t > DEDUP_WINDOW_MS) RECENT.delete(k);
  }
  if (last && now - last < DEDUP_WINDOW_MS) return false;
  RECENT.set(key, now);
  return true;
}

function safeStringifyMeta(meta: unknown): unknown {
  try {
    JSON.stringify(meta);
    return meta;
  } catch {
    try {
      return { repr: String(meta) };
    } catch {
      return null;
    }
  }
}

export function reportError(
  err: unknown,
  ctx: {
    source?: "client" | "boundary";
    level?: "error" | "warn" | "info";
    metadata?: Record<string, unknown>;
    guildId?: string | null;
  } = {},
) {
  if (typeof window === "undefined") return;
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : (() => {
            try {
              return JSON.stringify(err).slice(0, 500);
            } catch {
              return String(err);
            }
          })();
  if (!message) return;
  const stack = err instanceof Error ? err.stack ?? null : null;
  const route = window.location.pathname + window.location.search;
  const key = `${message}::${(stack ?? "").slice(0, 200)}`;
  if (!shouldSend(key)) return;

  logAppError({
    data: {
      level: ctx.level ?? "error",
      source: ctx.source ?? "client",
      message: message.slice(0, 2000),
      stack: stack ? stack.slice(0, 20000) : null,
      route: route.slice(0, 500),
      guildId: ctx.guildId ?? null,
      userAgent: navigator.userAgent.slice(0, 500),
      metadata: safeStringifyMeta(ctx.metadata),
    },
  }).catch(() => {});
}

let installed = false;
export function installGlobalErrorReporter() {
  if (typeof window === "undefined" || installed) return;
  installed = true;

  window.addEventListener("error", (event) => {
    reportError(event.error ?? event.message, { source: "client" });
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportError(event.reason, { source: "client", metadata: { kind: "unhandledrejection" } });
  });

  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    try {
      const first = args[0];
      // filtra ruído típico do React em dev — ainda assim envia, só dedup-ado
      const msg =
        first instanceof Error
          ? first
          : args.map((a) => (typeof a === "string" ? a : (() => { try { return JSON.stringify(a); } catch { return String(a); } })())).join(" ");
      reportError(msg, { source: "client", level: "error" });
    } catch {
      /* ignore */
    }
    return originalError.apply(console, args);
  };
}
