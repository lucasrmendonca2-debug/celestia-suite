/** Batch resolver for Discord user info (username + avatar URL) with in-memory cache. */
import { getDiscordBotToken } from "./bot-token.server";

export type DiscordUserInfo = {
  id: string;
  username: string;
  globalName: string | null;
  avatarUrl: string;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const NEGATIVE_TTL_MS = 60 * 60 * 1000; // 1h for failures
type Entry = { value: DiscordUserInfo | null; expiresAt: number };
const cache = new Map<string, Entry>();

function defaultAvatar(userId: string): string {
  // Discord algorithm: (id >> 22) % 6 for new system
  const idx = Number((BigInt(userId) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

function avatarUrlFor(userId: string, hash: string | null): string {
  if (!hash) return defaultAvatar(userId);
  const ext = hash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${hash}.${ext}?size=64`;
}

function fallback(userId: string): DiscordUserInfo {
  return {
    id: userId,
    username: userId,
    globalName: null,
    avatarUrl: defaultAvatar(userId),
  };
}

async function fetchOne(userId: string, token: string): Promise<DiscordUserInfo | null> {
  try {
    const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      id: string;
      username: string;
      global_name: string | null;
      avatar: string | null;
    };
    return {
      id: data.id,
      username: data.username,
      globalName: data.global_name,
      avatarUrl: avatarUrlFor(data.id, data.avatar),
    };
  } catch {
    return null;
  }
}

/**
 * Resolve a batch of Discord user IDs to username + avatar.
 * Cached per-instance for 24h on success, 1h on failure.
 * If no bot token configured, returns fallbacks (just the IDs).
 */
export async function resolveDiscordUsers(
  userIds: readonly string[],
): Promise<Record<string, DiscordUserInfo>> {
  const out: Record<string, DiscordUserInfo> = {};
  const now = Date.now();
  const missing: string[] = [];

  const unique = Array.from(new Set(userIds.filter((id) => /^\d{15,25}$/.test(id))));

  for (const id of unique) {
    const hit = cache.get(id);
    if (hit && hit.expiresAt > now) {
      out[id] = hit.value ?? fallback(id);
    } else {
      missing.push(id);
    }
  }

  if (missing.length === 0) return out;

  const token = getDiscordBotToken();
  if (!token) {
    for (const id of missing) out[id] = fallback(id);
    return out;
  }

  // Discord has no bulk /users endpoint — fetch in parallel with concurrency cap.
  const CONCURRENCY = 8;
  let cursor = 0;
  async function worker() {
    while (cursor < missing.length) {
      const id = missing[cursor++];
      const info = await fetchOne(id, token!);
      cache.set(id, {
        value: info,
        expiresAt: now + (info ? CACHE_TTL_MS : NEGATIVE_TTL_MS),
      });
      out[id] = info ?? fallback(id);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, missing.length) }, worker));
  return out;
}
