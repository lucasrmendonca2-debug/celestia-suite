/**
 * Render do rank card com @napi-rs/canvas.
 * Design moderno: fundo dark, ring no avatar, barra de progresso com gradient.
 */
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";

export interface RankCardInput {
  username: string;
  displayName: string;
  avatarUrl: string;
  level: number;
  xpInLevel: number;
  xpForNext: number;
  totalXp: number;
  rank: number;
  color: string;
  title: string;
  bannerUrl?: string | null;
}

const WIDTH = 900;
const HEIGHT = 280;

// Tenta registrar uma fonte default — silencioso se já registrada
try {
  if (!GlobalFonts.has("Inter")) {
    // Fontes do sistema disponíveis no host serão usadas como fallback
  }
} catch {
  /* noop */
}

function roundRect(ctx: import("@napi-rs/canvas").SKRSContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderRankCard(input: RankCardInput): Promise<Buffer> {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#0f1117";
  roundRect(ctx, 0, 0, WIDTH, HEIGHT, 24);
  ctx.fill();

  // Banner (opcional) — desenha como faixa superior
  if (input.bannerUrl) {
    try {
      const banner = await loadImage(input.bannerUrl);
      ctx.save();
      roundRect(ctx, 0, 0, WIDTH, HEIGHT, 24);
      ctx.clip();
      ctx.globalAlpha = 0.35;
      ctx.drawImage(banner, 0, 0, WIDTH, HEIGHT);
      ctx.globalAlpha = 1;
      ctx.restore();
    } catch {
      /* ignora banner inválido */
    }
  }

  // Overlay sutil pra legibilidade
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, "rgba(15,17,23,0.45)");
  grad.addColorStop(1, "rgba(15,17,23,0.85)");
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, WIDTH, HEIGHT, 24);
  ctx.fill();

  // Avatar
  const avatarSize = 160;
  const avatarX = 50;
  const avatarY = (HEIGHT - avatarSize) / 2;
  try {
    const avatar = await loadImage(input.avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();
    // Ring
    ctx.lineWidth = 6;
    ctx.strokeStyle = input.color;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
    ctx.stroke();
  } catch {
    // fallback circle
    ctx.fillStyle = input.color;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Texto: nome
  const textX = avatarX + avatarSize + 32;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px Sans";
  ctx.textBaseline = "top";
  ctx.fillText(truncate(ctx, input.displayName, 420), textX, 56);

  // Título / subtítulo
  if (input.title) {
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "20px Sans";
    ctx.fillText(truncate(ctx, input.title, 420), textX, 100);
  }

  // Nível e rank (linha à direita)
  ctx.textAlign = "right";
  ctx.fillStyle = "#a1a1aa";
  ctx.font = "16px Sans";
  ctx.fillText(`RANK #${input.rank}`, WIDTH - 40, 40);
  ctx.fillStyle = input.color;
  ctx.font = "bold 48px Sans";
  ctx.fillText(`LVL ${input.level}`, WIDTH - 40, 62);
  ctx.textAlign = "left";

  // Barra de progresso
  const barX = textX;
  const barY = HEIGHT - 80;
  const barW = WIDTH - barX - 50;
  const barH = 26;

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, barX, barY, barW, barH, barH / 2);
  ctx.fill();

  const ratio = input.xpForNext > 0 ? Math.min(1, input.xpInLevel / input.xpForNext) : 0;
  if (ratio > 0) {
    const gg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    gg.addColorStop(0, input.color);
    gg.addColorStop(1, "#ffffff");
    ctx.fillStyle = gg;
    roundRect(ctx, barX, barY, Math.max(barH, barW * ratio), barH, barH / 2);
    ctx.fill();
  }

  ctx.fillStyle = "#e5e7eb";
  ctx.font = "16px Sans";
  ctx.fillText(
    `${input.xpInLevel.toLocaleString("pt-BR")} / ${input.xpForNext.toLocaleString("pt-BR")} XP`,
    barX,
    barY - 28,
  );

  ctx.textAlign = "right";
  ctx.fillStyle = "#a1a1aa";
  ctx.fillText(`Total ${input.totalXp.toLocaleString("pt-BR")} XP`, barX + barW, barY - 28);
  ctx.textAlign = "left";

  return canvas.toBuffer("image/png");
}

function truncate(ctx: import("@napi-rs/canvas").SKRSContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let s = text;
  while (s.length > 0 && ctx.measureText(s + "…").width > maxWidth) s = s.slice(0, -1);
  return s + "…";
}
