/**
 * Render do rank card com @napi-rs/canvas.
 * Suporta personalização: accent color, background color, text color e variantes (default/minimal/gradient).
 */
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";

export type CardStyle = "default" | "minimal" | "gradient";

export interface RankCardInput {
  username: string;
  displayName: string;
  avatarUrl: string;
  level: number;
  xpInLevel: number;
  xpForNext: number;
  totalXp: number;
  rank: number;
  /** Cor de destaque (anel do avatar, número do level, gradient da barra). */
  accentColor: string;
  /** Cor de fundo do card. */
  backgroundColor: string;
  /** Cor principal do texto. */
  textColor: string;
  /** Estilo visual. */
  cardStyle?: CardStyle;
  title: string;
  bannerUrl?: string | null;
}

const WIDTH = 900;
const HEIGHT = 280;

try { if (!GlobalFonts.has("Inter")) { /* fallback do sistema */ } } catch { /* noop */ }

function roundRect(ctx: import("@napi-rs/canvas").SKRSContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** "#5865F2" + alpha 0–1 → "rgba(r,g,b,a)" */
function withAlpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function mutedFrom(textColor: string): string {
  // Texto secundário ≈ 60% do principal
  return withAlpha(textColor, 0.6);
}

export async function renderRankCard(input: RankCardInput): Promise<Buffer> {
  const style: CardStyle = input.cardStyle ?? "default";
  const accent = input.accentColor || "#5865F2";
  const bg = input.backgroundColor || "#0f1117";
  const text = input.textColor || "#ffffff";
  const muted = mutedFrom(text);

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // Background base
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, WIDTH, HEIGHT, 24);
  ctx.fill();

  // Variante gradient: fundo com gradient horizontal bg → accent (mais escuro)
  if (style === "gradient") {
    const bgGrad = ctx.createLinearGradient(0, 0, WIDTH, 0);
    bgGrad.addColorStop(0, bg);
    bgGrad.addColorStop(1, withAlpha(accent, 0.35));
    ctx.fillStyle = bgGrad;
    roundRect(ctx, 0, 0, WIDTH, HEIGHT, 24);
    ctx.fill();
  }

  // Banner (opcional)
  if (input.bannerUrl) {
    try {
      const banner = await loadImage(input.bannerUrl);
      ctx.save();
      roundRect(ctx, 0, 0, WIDTH, HEIGHT, 24);
      ctx.clip();
      ctx.globalAlpha = style === "minimal" ? 0.18 : 0.35;
      ctx.drawImage(banner, 0, 0, WIDTH, HEIGHT);
      ctx.globalAlpha = 1;
      ctx.restore();
    } catch { /* ignora */ }
  }

  // Overlay pra legibilidade (mais fraco no minimal)
  const overlayTop = style === "minimal" ? 0.2 : 0.45;
  const overlayBot = style === "minimal" ? 0.55 : 0.85;
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, withAlpha(bg, overlayTop));
  grad.addColorStop(1, withAlpha(bg, overlayBot));
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, WIDTH, HEIGHT, 24);
  ctx.fill();

  // Borda accent no minimal
  if (style === "minimal") {
    ctx.strokeStyle = withAlpha(accent, 0.5);
    ctx.lineWidth = 2;
    roundRect(ctx, 1, 1, WIDTH - 2, HEIGHT - 2, 23);
    ctx.stroke();
  }

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
    ctx.lineWidth = style === "minimal" ? 3 : 6;
    ctx.strokeStyle = accent;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
    ctx.stroke();
  } catch {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const textX = avatarX + avatarSize + 32;

  // Nome
  ctx.fillStyle = text;
  ctx.font = "bold 36px Sans";
  ctx.textBaseline = "top";
  ctx.fillText(truncate(ctx, input.displayName, 420), textX, 56);

  // Título
  if (input.title) {
    ctx.fillStyle = muted;
    ctx.font = "20px Sans";
    ctx.fillText(truncate(ctx, input.title, 420), textX, 100);
  }

  // Rank + Level
  ctx.textAlign = "right";
  ctx.fillStyle = muted;
  ctx.font = "16px Sans";
  ctx.fillText(`RANK #${input.rank}`, WIDTH - 40, 40);
  ctx.fillStyle = accent;
  ctx.font = "bold 48px Sans";
  ctx.fillText(`LVL ${input.level}`, WIDTH - 40, 62);
  ctx.textAlign = "left";

  // Barra de progresso
  const barX = textX;
  const barY = HEIGHT - 80;
  const barW = WIDTH - barX - 50;
  const barH = 26;

  ctx.fillStyle = withAlpha(text, 0.08);
  roundRect(ctx, barX, barY, barW, barH, barH / 2);
  ctx.fill();

  const ratio = input.xpForNext > 0 ? Math.min(1, input.xpInLevel / input.xpForNext) : 0;
  if (ratio > 0) {
    let fill: string | CanvasGradient = accent;
    if (style !== "minimal") {
      const gg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      gg.addColorStop(0, accent);
      gg.addColorStop(1, text);
      fill = gg;
    }
    ctx.fillStyle = fill;
    roundRect(ctx, barX, barY, Math.max(barH, barW * ratio), barH, barH / 2);
    ctx.fill();
  }

  ctx.fillStyle = withAlpha(text, 0.9);
  ctx.font = "16px Sans";
  ctx.fillText(
    `${input.xpInLevel.toLocaleString("pt-BR")} / ${input.xpForNext.toLocaleString("pt-BR")} XP`,
    barX,
    barY - 28,
  );

  ctx.textAlign = "right";
  ctx.fillStyle = muted;
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
