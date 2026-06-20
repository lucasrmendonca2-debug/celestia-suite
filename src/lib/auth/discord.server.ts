/**
 * Cliente da Discord API + utilidades de OAuth2.
 * Server-only (usa process.env.DISCORD_CLIENT_SECRET).
 */
import { createHmac, timingSafeEqual } from "crypto";

export const DISCORD_API = "https://discord.com/api/v10";
const DEFAULT_DISCORD_ORIGIN = "https://id-preview--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app";
const DISCORD_CALLBACK_PATH = "/api/auth/discord/callback";

export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  discriminator: string;
  email?: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string; // bitfield como string
  features: string[];
}

const PERM_ADMINISTRATOR = 0x8n;
const PERM_MANAGE_GUILD = 0x20n;

/** Mantém apenas guilds onde o usuário pode gerenciar configurações. */
export function filterManageableGuilds(guilds: DiscordGuild[]): DiscordGuild[] {
  return guilds.filter((g) => {
    if (g.owner) return true;
    try {
      const perms = BigInt(g.permissions);
      return (perms & PERM_ADMINISTRATOR) !== 0n || (perms & PERM_MANAGE_GUILD) !== 0n;
    } catch {
      return false;
    }
  });
}

export function guildIconUrl(g: Pick<DiscordGuild, "id" | "icon">): string | null {
  if (!g.icon) return null;
  const ext = g.icon.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${ext}?size=128`;
}

export function userAvatarUrl(u: Pick<DiscordUser, "id" | "avatar" | "discriminator">): string {
  if (u.avatar) {
    const ext = u.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${ext}?size=128`;
  }
  const idx = u.discriminator && u.discriminator !== "0"
    ? Number(u.discriminator) % 5
    : Number(BigInt(u.id) >> 22n) % 6;
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

/* ---------------- OAuth ---------------- */

export function getOAuthConfig() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("DISCORD_CLIENT_ID/DISCORD_CLIENT_SECRET ausentes nas secrets.");
  }
  return { clientId, clientSecret };
}

function oauthStateSecret(): string {
  return process.env.SESSION_SECRET ?? "dev-only-secret-please-change-32+chars";
}

export function createOAuthState(): string {
  const payload = Buffer.from(JSON.stringify({ nonce: crypto.randomUUID(), iat: Date.now() })).toString("base64url");
  const signature = createHmac("sha256", oauthStateSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyOAuthState(state: string): boolean {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) return false;
  const expected = createHmac("sha256", oauthStateSecret()).update(payload).digest("base64url");
  const givenBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (givenBuffer.length !== expectedBuffer.length || !timingSafeEqual(givenBuffer, expectedBuffer)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { iat?: number };
    return typeof data.iat === "number" && Date.now() - data.iat < 10 * 60 * 1000;
  } catch {
    return false;
  }
}

function safeBrowserOrigin(origin: string | null): string | null {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const isLovable = url.hostname === "lovable.app" || url.hostname.endsWith(".lovable.app");
    if ((url.protocol === "https:" && isLovable) || (url.protocol === "http:" && isLocal)) {
      return url.origin;
    }
  } catch {
    return null;
  }
  return null;
}

function isLocalOrigin(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

export function makeDiscordCallbackUri(request: Request, browserOrigin?: string | null): string {
  const explicitRedirectUri = process.env.DISCORD_REDIRECT_URI?.trim();
  if (explicitRedirectUri) return explicitRedirectUri;

  const browserSafeOrigin = safeBrowserOrigin(browserOrigin ?? null);
  const origin = isLocalOrigin(browserSafeOrigin)
    ? browserSafeOrigin
    : safeBrowserOrigin(DEFAULT_DISCORD_ORIGIN);
  if (origin) return `${origin}${DISCORD_CALLBACK_PATH}`;

  const requestUrl = new URL(request.url);
  const forwarded = request.headers.get("forwarded") ?? "";
  const forwardedHost = forwarded.match(/host=([^;,]+)/i)?.[1]?.replaceAll('"', "").trim();
  const forwardedProto = forwarded.match(/proto=([^;,]+)/i)?.[1]?.replaceAll('"', "").trim();
  const referer = request.headers.get("referer");
  const refererUrl = referer ? new URL(referer) : null;
  const headerHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
    || request.headers.get("x-original-host")
    || request.headers.get("x-real-host")
    || forwardedHost
    || request.headers.get("host")
    || requestUrl.host;
  const isInternalHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(headerHost);
  const host = isInternalHost && refererUrl?.host ? refererUrl.host : headerHost;
  const protocol = host.includes("localhost")
    ? "http"
    : request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || forwardedProto || refererUrl?.protocol.replace(":", "") || "https";

  return `${protocol}://${host}${DISCORD_CALLBACK_PATH}`;
}

export function buildAuthorizeUrl(state: string, redirectUri: string): string {
  const { clientId } = getOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "identify guilds",
    state,
    prompt: "consent",
    redirect_uri: redirectUri,
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string, redirectUri: string) {
  const { clientId, clientSecret } = getOAuthConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Discord token exchange falhou: ${res.status} ${body} (redirect_uri=${redirectUri})`);
  }
  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
  };
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`/users/@me falhou: ${res.status}`);
  return (await res.json()) as DiscordUser;
}

const guildsCache = new Map<string, { at: number; data: DiscordGuild[] }>();
const GUILDS_TTL_MS = 60_000;

export async function fetchUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const cached = guildsCache.get(accessToken);
  const now = Date.now();
  if (cached && now - cached.at < GUILDS_TTL_MS) return cached.data;

  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 429 && cached) return cached.data;
  if (!res.ok) {
    if (cached) return cached.data;
    throw new Error(`/users/@me/guilds falhou: ${res.status}`);
  }
  const data = (await res.json()) as DiscordGuild[];
  guildsCache.set(accessToken, { at: now, data });
  if (guildsCache.size > 200) {
    const oldest = [...guildsCache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) guildsCache.delete(oldest[0]);
  }
  return data;
}
