/**
 * HTTP bridge usado pelo site para o fluxo de /daily no estilo Loritta.
 *
 * Endpoints (protegidos por header `x-bot-secret` = BOT_API_SECRET):
 *  POST /api/daily/status  { token }  -> status do resgate
 *  POST /api/daily/claim   { token }  -> efetiva o resgate (atômico)
 *
 * Tokens são gerados pelo comando /daily (curtos, TTL 10 min) e armazenados na
 * collection `DailyToken`. Cada token é one-time-use por design.
 */
import http from "node:http";
import crypto from "node:crypto";
import { logger } from "../bot/utils/logger.js";
import { env } from "../config/env.js";
import { DailyToken, EconomyAccount } from "../database/models.js";
import {
  addWallet,
  currencyFromConfig,
  dailyClaimAtomic,
  getAccount,
  isVip,
} from "../bot/systems/economy/economy.js";
import { getConfig } from "../bot/utils/guildCache.js";
import { logTx } from "../bot/systems/economy/economy.tx.js";
import { incrementMissionProgress } from "../bot/systems/economy/missions.js";

const DAY = 24 * 3600 * 1000;
const TOKEN_TTL = 10 * 60 * 1000;

export function newDailyToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export async function issueDailyToken(guildId: string, userId: string) {
  const token = newDailyToken();
  await DailyToken.create({
    token,
    guildId,
    userId,
    expiresAt: new Date(Date.now() + TOKEN_TTL),
  });
  return token;
}

async function readJson(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function send(res: http.ServerResponse, status: number, body: any) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-bot-secret");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.end(JSON.stringify(body));
}

async function buildStatus(guildId: string, userId: string) {
  const cfg = await getConfig(guildId);
  const c = currencyFromConfig(cfg);
  await getAccount(guildId, userId);
  const acc = await EconomyAccount.findOne({ guildId, userId });
  const now = Date.now();
  const last = acc?.lastDaily ? acc.lastDaily.getTime() : 0;
  const canClaim = !last || now - last >= DAY;
  const nextClaimAt = last ? new Date(last + DAY).toISOString() : null;
  const streak = acc?.streakDaily ?? 0;
  const projectedStreak = canClaim ? streak + 1 : streak;
  const [vipMember, premiumMult] = await Promise.all([
    isVip(guildId, userId),
    import("../bot/systems/premium/premium.features.js")
      .then((m) => m.getUserVipMultiplier(userId, guildId, "daily"))
      .catch(() => 1),
  ]);
  const vipMult = vipMember ? cfg.economyVipMultiplier : 1;
  const streakBonus = Math.min(projectedStreak, 7) * 50;
  const amount = Math.floor(
    (cfg.economyDailyAmount + streakBonus) * vipMult * premiumMult,
  );
  return {
    canClaim,
    nextClaimAt,
    streak,
    projectedStreak,
    amount,
    base: cfg.economyDailyAmount,
    streakBonus,
    vipMultiplier: vipMult,
    premiumMultiplier: premiumMult,
    currency: { name: c.name, emoji: c.emoji },
    wallet: acc?.wallet ?? 0,
  };
}

async function handleStatus(req: http.IncomingMessage, res: http.ServerResponse) {
  const { token } = await readJson(req);
  if (!token) return send(res, 400, { error: "missing token" });
  const t = await DailyToken.findOne({ token });
  if (!t) return send(res, 404, { error: "invalid token" });
  if (t.expiresAt.getTime() < Date.now())
    return send(res, 410, { error: "expired" });
  const status = await buildStatus(t.guildId, t.userId);
  return send(res, 200, { ok: true, user: { id: t.userId, guildId: t.guildId }, ...status });
}

async function handleClaim(req: http.IncomingMessage, res: http.ServerResponse) {
  const { token } = await readJson(req);
  if (!token) return send(res, 400, { error: "missing token" });
  const t = await DailyToken.findOneAndDelete({ token });
  if (!t) return send(res, 404, { error: "invalid token" });
  if (t.expiresAt.getTime() < Date.now())
    return send(res, 410, { error: "expired" });

  const { guildId, userId } = t;
  const now = new Date();
  await getAccount(guildId, userId);
  const cutoff = new Date(now.getTime() - DAY);
  const claimed = await EconomyAccount.findOneAndUpdate(
    {
      guildId,
      userId,
      $or: [{ lastDaily: null }, { lastDaily: { $lte: cutoff } }],
    },
    { $set: { lastDaily: now } },
    { new: true },
  );
  if (!claimed) {
    const fresh = await EconomyAccount.findOne({ guildId, userId });
    return send(res, 409, {
      error: "already_claimed",
      nextClaimAt: fresh?.lastDaily
        ? new Date(fresh.lastDaily.getTime() + DAY).toISOString()
        : null,
    });
  }

  const cfg = await getConfig(guildId);
  const c = currencyFromConfig(cfg);
  const newStreak = (claimed.streakDaily ?? 0) > 0 ? (claimed.streakDaily ?? 0) + 1 : 1;
  const [vipMember, premiumMult] = await Promise.all([
    isVip(guildId, userId),
    import("../bot/systems/premium/premium.features.js")
      .then((m) => m.getUserVipMultiplier(userId, guildId, "daily"))
      .catch(() => 1),
  ]);
  const vipMult = vipMember ? cfg.economyVipMultiplier : 1;
  const streakBonus = Math.min(newStreak, 7) * 50;
  const amount = Math.floor(
    (cfg.economyDailyAmount + streakBonus) * vipMult * premiumMult,
  );

  const final = await EconomyAccount.findOneAndUpdate(
    { guildId, userId },
    { $inc: { wallet: amount }, $set: { streakDaily: newStreak } },
    { new: true },
  );
  const wallet = final?.wallet ?? amount;

  logTx({
    guildId,
    userId,
    kind: "daily",
    amount,
    balanceAfter: wallet,
    reason: `Diária (web, streak ${newStreak})`,
  }).catch((err) => logger.warn({ err }, "logTx daily web falhou"));
  incrementMissionProgress(guildId, userId, "daily").catch(() => {});

  // Chance pequena (2%) de dropar cosmético comum como bônus da diária.
  let dropped: { id: string; name: string; rarity: string; image_url: string } | null = null;
  try {
    const { tryDropCommonCosmetic } = await import("../bot/systems/cosmetics/cosmetics.service.js");
    const c = await tryDropCommonCosmetic({ userId, chance: 0.02, reason: "daily" });
    if (c) dropped = { id: c.id, name: c.name, rarity: c.rarity, image_url: c.preview_url ?? c.image_url };
  } catch (err) {
    logger.debug({ err }, "daily cosmetic drop falhou");
  }

  return send(res, 200, {
    ok: true,
    amount,
    wallet,
    streak: newStreak,
    streakBonus,
    vipMultiplier: vipMult,
    premiumMultiplier: premiumMult,
    currency: { name: c.name, emoji: c.emoji },
    nextClaimAt: new Date(now.getTime() + DAY).toISOString(),
    drop: dropped,
  });
}

export function startHttpServer() {
  if (!env.BOT_API_SECRET) {
    logger.warn("BOT_API_SECRET ausente — HTTP bridge não será iniciado");
    return;
  }
  const ports = [...new Set([Number(env.BOT_HTTP_PORT ?? 3001), 8080])];
  const handler = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    if (req.method === "OPTIONS") return send(res, 204, {});
    if (req.method !== "POST") return send(res, 405, { error: "method not allowed" });
    const secret = req.headers["x-bot-secret"];
    if (secret !== env.BOT_API_SECRET) return send(res, 401, { error: "unauthorized" });
    try {
      if (req.url === "/api/daily/status") return await handleStatus(req, res);
      if (req.url === "/api/daily/claim") return await handleClaim(req, res);
      return send(res, 404, { error: "not found" });
    } catch (err: any) {
      logger.error({ err, url: req.url }, "HTTP bridge erro");
      return send(res, 500, { error: "internal", message: err?.message });
    }
  };
  for (const port of ports) {
    const server = http.createServer(handler);
    server.on("error", (err) => logger.error({ err, port }, "HTTP bridge falhou ao iniciar"));
    server.listen(port, "0.0.0.0", () => {
      logger.info({ port }, "🌐 HTTP bridge ativo");
    });
  }
}
