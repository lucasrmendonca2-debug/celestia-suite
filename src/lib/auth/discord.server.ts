/**
 * Cliente da Discord API + utilidades de OAuth2.
 * Server-only (usa process.env.DISCORD_CLIENT_SECRET).
 */

export const DISCORD_API = "https://discord.com/api/v10";

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

export function makeDiscordCallbackUri(request: Request): string {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || requestUrl.host;
  const protocol = forwardedProto || requestUrl.protocol.replace(":", "") || "https";

  return `${protocol}://${host}/api/auth/discord/callback`;
}

export function buildAuthorizeUrl(redirectUri: string, state: string): string {
  const { clientId } = getOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify guilds",
    state,
    prompt: "consent",
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
  if (!res.ok) throw new Error(`Discord token exchange falhou: ${res.status}`);
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

export async function fetchUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`/users/@me/guilds falhou: ${res.status}`);
  return (await res.json()) as DiscordGuild[];
}
