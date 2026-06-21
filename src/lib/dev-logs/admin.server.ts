/**
 * Admin check para o painel de dev-logs.
 * Whitelist de Discord user IDs vinda da env DEV_LOG_ADMIN_IDS (comma-separated).
 */
import { getSession } from "@/lib/auth/session.server";

export function getAdminIds(): string[] {
  const raw = process.env.DEV_LOG_ADMIN_IDS ?? "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  const userId = session.data.userId;
  if (!userId) return false;
  const ids = getAdminIds();
  if (ids.length === 0) return false;
  return ids.includes(userId);
}

export async function assertAdmin(): Promise<{ id: string; tag: string }> {
  const session = await getSession();
  const userId = session.data.userId;
  if (!userId) throw new Error("Não autenticado.");
  const ids = getAdminIds();
  if (ids.length === 0) {
    throw new Error("DEV_LOG_ADMIN_IDS não configurado nas secrets do projeto.");
  }
  if (!ids.includes(userId)) throw new Error("Acesso restrito a admins.");
  return { id: userId, tag: session.data.username ?? userId };
}
