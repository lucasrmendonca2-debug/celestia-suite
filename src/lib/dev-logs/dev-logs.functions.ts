/**
 * Server functions do painel interno de erros.
 *
 *  - logAppError: aberto pra qualquer caller (cliente, server middleware,
 *    server fn). Faz dedup por fingerprint (incrementa count em vez de
 *    inserir nova linha) pra não explodir a tabela em loops de erro.
 *  - listAppErrors / resolveAppError / clearResolvedAppErrors / wipeOldAppErrors:
 *    admin-only (whitelist em DEV_LOG_ADMIN_IDS).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LogInput = z.object({
  level: z.enum(["error", "warn", "info"]).default("error"),
  source: z.enum(["client", "server", "serverfn", "boundary"]).default("client"),
  message: z.string().min(1).max(2000),
  stack: z.string().max(20000).optional().nullable(),
  route: z.string().max(500).optional().nullable(),
  guildId: z.string().max(64).optional().nullable(),
  userAgent: z.string().max(500).optional().nullable(),
  metadata: z.unknown().optional(),
});

function makeFingerprint(message: string, stack?: string | null, route?: string | null) {
  const top = (stack ?? "").split("\n").slice(0, 3).join("|");
  return [message.slice(0, 200), top, route ?? ""].join("::");
}

export const logAppError = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => LogInput.parse(d))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/lib/supabase-admin.server");
      const { getSession } = await import("@/lib/auth/session.server");
      const session = await getSession().catch(() => ({ data: {} as Record<string, string> }));
      const userId = (session.data as { userId?: string }).userId ?? null;
      const userTag = (session.data as { username?: string }).username ?? null;
      const fingerprint = makeFingerprint(data.message, data.stack, data.route);

      // dedup
      const { data: existing } = await supabaseAdmin
        .from("app_error_logs")
        .select("id, count")
        .eq("fingerprint", fingerprint)
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from("app_error_logs")
          .update({
            count: (existing.count ?? 1) + 1,
            last_seen_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        return { ok: true, deduped: true };
      }

      await supabaseAdmin.from("app_error_logs").insert({
        level: data.level,
        source: data.source,
        message: data.message,
        stack: data.stack ?? null,
        route: data.route ?? null,
        user_id: userId,
        user_tag: userTag,
        guild_id: data.guildId ?? null,
        user_agent: data.userAgent ?? null,
        fingerprint,
        metadata: (data.metadata ?? null) as never,
      });
      return { ok: true, deduped: false };
    } catch (err) {
      // last resort — não pode quebrar nada
      console.error("[logAppError] falhou:", err);
      return { ok: false };
    }
  });

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export interface AppErrorRow {
  id: string;
  created_at: string;
  last_seen_at: string;
  level: "error" | "warn" | "info";
  source: "client" | "server" | "serverfn" | "boundary";
  message: string;
  stack: string | null;
  route: string | null;
  user_id: string | null;
  user_tag: string | null;
  guild_id: string | null;
  user_agent: string | null;
  fingerprint: string | null;
  count: number;
  resolved: boolean;
  metadata: Json;
}

const ListInput = z.object({
  level: z.enum(["error", "warn", "info"]).optional(),
  source: z.enum(["client", "server", "serverfn", "boundary"]).optional(),
  search: z.string().max(200).optional(),
  resolved: z.boolean().optional(),
  limit: z.number().int().min(1).max(500).default(100),
});

export const listAppErrors = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => ListInput.parse(d ?? {}))
  .handler(async ({ data }): Promise<AppErrorRow[]> => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin();
    const { supabaseAdmin } = await import("@/lib/supabase-admin.server");
    let q = supabaseAdmin
      .from("app_error_logs")
      .select("*")
      .order("last_seen_at", { ascending: false })
      .limit(data.limit);
    if (data.level) q = q.eq("level", data.level);
    if (data.source) q = q.eq("source", data.source);
    if (typeof data.resolved === "boolean") q = q.eq("resolved", data.resolved);
    if (data.search) q = q.ilike("message", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as AppErrorRow[];
  });

export const resolveAppError = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; resolved?: boolean }) =>
    z.object({ id: z.string().uuid(), resolved: z.boolean().default(true) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin();
    const { supabaseAdmin } = await import("@/lib/supabase-admin.server");
    const { error } = await supabaseAdmin
      .from("app_error_logs")
      .update({ resolved: data.resolved })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearResolvedAppErrors = createServerFn({ method: "POST" }).handler(async () => {
  const { assertAdmin } = await import("./admin.server");
  await assertAdmin();
  const { supabaseAdmin } = await import("@/lib/supabase-admin.server");
  const { error } = await supabaseAdmin
    .from("app_error_logs")
    .delete()
    .eq("resolved", true);
  if (error) throw new Error(error.message);
  return { ok: true };
});

export const wipeOldAppErrors = createServerFn({ method: "POST" })
  .inputValidator((d: { days?: number }) =>
    z.object({ days: z.number().int().min(1).max(365).default(7) }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin();
    const { supabaseAdmin } = await import("@/lib/supabase-admin.server");
    const cutoff = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabaseAdmin
      .from("app_error_logs")
      .delete()
      .lt("created_at", cutoff);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const checkAdminAccess = createServerFn({ method: "GET" }).handler(async () => {
  const { isAdmin } = await import("./admin.server");
  return { isAdmin: await isAdmin() };
});
