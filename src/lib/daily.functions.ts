import { createServerFn } from "@tanstack/react-start";
import { getSession } from "@/lib/auth/session.server";

function botBase(): string | null {
  const url = process.env.BOT_API_URL?.replace(/\/$/, "");
  if (!url) return null;
  return url;
}

async function callBot(path: string, body: any) {
  const base = botBase();
  if (!base) {
    return { error: "bot_not_configured" as const };
  }
  const secret = process.env.BOT_API_SECRET;
  if (!secret) return { error: "bot_secret_missing" as const };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-bot-secret": secret,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data?.error ?? `http_${res.status}`, data };
    return data;
  } catch (e: any) {
    return {
      error: e?.name === "AbortError" ? ("bot_timeout" as const) : ("fetch_failed" as const),
      message: e?.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export interface DailyStatusDTO {
  ok: true;
  user: { id: string; guildId: string };
  canClaim: boolean;
  nextClaimAt: string | null;
  streak: number;
  projectedStreak: number;
  amount: number;
  base: number;
  streakBonus: number;
  vipMultiplier: number;
  premiumMultiplier: number;
  currency: { name: string; emoji: string };
  wallet: number;
}

export interface DailyClaimDTO {
  ok: true;
  amount: number;
  wallet: number;
  streak: number;
  streakBonus: number;
  vipMultiplier: number;
  premiumMultiplier: number;
  currency: { name: string; emoji: string };
  nextClaimAt: string;
}

export const getDailyStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session.data.userId) return { error: "not_logged_in" as const };
    const result = await callBot("/api/daily/status", { token: data.token });
    if (result?.error) return result;
    if (result?.user?.id && result.user.id !== session.data.userId) {
      return { error: "token_user_mismatch" as const };
    }
    return result as DailyStatusDTO;
  });

export const claimDaily = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const session = await getSession();
    if (!session.data.userId) return { error: "not_logged_in" as const };
    const result = await callBot("/api/daily/claim", { token: data.token });
    return result as DailyClaimDTO | { error: string };
  });
