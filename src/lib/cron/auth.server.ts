/**
 * Auth helper para endpoints /api/public/cron/*.
 *
 * Requer header `x-cron-secret` igual a process.env.CRON_SECRET.
 * Comparação em tempo constante para evitar timing side-channel trivial.
 *
 * Por que CRON_SECRET dedicado e não a publishable key?
 * A publishable key vive no bundle do cliente — qualquer pessoa pode disparar
 * rotações, gerar missões, etc. CRON_SECRET é server-only e só o pg_cron conhece.
 */
import { timingSafeEqual } from "crypto";

export function isAuthorizedCron(request: Request): boolean {
  const provided = request.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
