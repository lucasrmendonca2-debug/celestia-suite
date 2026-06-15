/**
 * Sessão criptografada em cookie (server-only).
 * Usada pelo OAuth do Discord e pelas server functions do dashboard.
 */
import { useSession } from "@tanstack/react-start/server";

export interface ZenoxSession {
  userId?: string;
  username?: string;
  globalName?: string | null;
  avatar?: string | null;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number; // epoch ms
}

export async function getSession() {
  return useSession<ZenoxSession>({
    password: process.env.SESSION_SECRET ?? "dev-only-secret-please-change-32+chars",
    name: "zenox_session",
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    },
  });
}
