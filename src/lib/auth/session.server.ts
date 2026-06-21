/**
 * Sessão do dashboard em cookie HTTP-only assinado.
 *
 * Mantemos um formato próprio para garantir que o Set-Cookie sobreviva aos
 * redirects do OAuth em preview/publicação e seja lido igualmente por rotas e
 * server functions.
 */
import { createHmac, timingSafeEqual } from "crypto";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

export interface ZenoxSession {
  userId?: string;
  username?: string;
  globalName?: string | null;
  avatar?: string | null;
  accessToken?: string;
  refreshToken?: string;
  oauthRedirectUri?: string;
  postLoginRedirect?: string;
  expiresAt?: number; // epoch ms
}


const COOKIE_NAME = "zenox_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function sessionSecret(): string {
  return process.env.SESSION_SECRET ?? "dev-only-secret-please-change-32+chars";
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

function cleanSession(data: ZenoxSession): ZenoxSession {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined && value !== ""),
  ) as ZenoxSession;
}

function sealSession(data: ZenoxSession): string {
  const payload = Buffer.from(JSON.stringify(cleanSession(data)), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function unsealSession(value?: string): ZenoxSession {
  if (!value) return {};
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return {};

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ZenoxSession;
    if (data.expiresAt && Date.now() > data.expiresAt) return {};
    return cleanSession(data);
  } catch {
    return {};
  }
}

function cookieBase() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

function serializeCookie(name: string, value: string, maxAge: number): string {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function createSessionSetCookie(data: ZenoxSession): string {
  return serializeCookie(COOKIE_NAME, sealSession(data), MAX_AGE_SECONDS);
}

export function createSessionClearCookie(): string {
  return serializeCookie(COOKIE_NAME, "", 0);
}

export async function getSession() {
  const data = unsealSession(getCookie(COOKIE_NAME));

  return {
    data,
    update: async (next: ZenoxSession) => {
      setCookie(COOKIE_NAME, sealSession(next), {
        ...cookieBase(),
        maxAge: MAX_AGE_SECONDS,
      });
    },
    clear: async () => {
      deleteCookie(COOKIE_NAME, { path: "/" });
      setCookie(COOKIE_NAME, "", {
        ...cookieBase(),
        maxAge: 0,
      });
    },
  };
}
