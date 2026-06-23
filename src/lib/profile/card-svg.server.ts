/**
 * Gerador SVG puro do Profile Card. Sem dependências runtime — apenas string.
 * Dimensões: 800×400 (proporção 2:1, ideal para embed Discord).
 */

export interface ProfileCardData {
  userId: string;
  username: string;
  avatarUrl: string | null;
  accentColor: string;
  bio: string | null;
  bannerUrl: string | null;
  frameUrl: string | null;
  stickerUrls: string[];
  effectName: string | null;
  level: number;
  xpInLevel: number;
  xpForNext: number;
  totalBalance: number;
  reputation: number;
  rarity: "common" | "rare" | "epic" | "legendary" | "seasonal" | null;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function truncate(s: string, max: number) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

export function buildProfileCardSvg(d: ProfileCardData): string {
  const W = 800;
  const H = 400;
  const accent = /^#[0-9a-fA-F]{6}$/.test(d.accentColor) ? d.accentColor : "#f59e0b";

  const xpPct = d.xpForNext > 0 ? clamp(d.xpInLevel / d.xpForNext, 0, 1) : 0;
  const xpBarW = 460;
  const xpBarFill = Math.round(xpBarW * xpPct);

  const name = escapeXml(truncate(d.username || "Usuário", 24));
  const bio = d.bio ? escapeXml(truncate(d.bio, 80)) : "";

  const isLegendary = d.rarity === "legendary";
  const glowColor = isLegendary ? "#fbbf24" : accent;

  // Banner: imagem se houver, senão gradiente padrão Zenox (âmbar→preto) com brilho decorativo
  const bannerEl = d.bannerUrl
    ? `<image href="${escapeXml(d.bannerUrl)}" x="0" y="0" width="${W}" height="180" preserveAspectRatio="xMidYMid slice" clip-path="url(#bannerClip)"/>`
    : `<g>
         <rect x="0" y="0" width="${W}" height="180" fill="url(#defaultBannerGrad)"/>
         <circle cx="640" cy="40" r="120" fill="${accent}" opacity="0.18"/>
         <circle cx="720" cy="160" r="80" fill="${accent}" opacity="0.10"/>
         <circle cx="60" cy="20" r="60" fill="#fbbf24" opacity="0.08"/>
       </g>`;

  // Frame ao redor do avatar
  const avatarCX = 100;
  const avatarCY = 200;
  const avatarR = 60;
  const frameEl = d.frameUrl
    ? `<image href="${escapeXml(d.frameUrl)}" x="${avatarCX - avatarR - 10}" y="${avatarCY - avatarR - 10}" width="${(avatarR + 10) * 2}" height="${(avatarR + 10) * 2}" preserveAspectRatio="xMidYMid meet"/>`
    : "";

  const avatarEl = d.avatarUrl
    ? `<image href="${escapeXml(d.avatarUrl)}" x="${avatarCX - avatarR}" y="${avatarCY - avatarR}" width="${avatarR * 2}" height="${avatarR * 2}" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="${avatarCX}" cy="${avatarCY}" r="${avatarR}" fill="${accent}"/>
       <text x="${avatarCX}" y="${avatarCY + 10}" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="40" font-weight="700" fill="#fff">${escapeXml((d.username[0] ?? "?").toUpperCase())}</text>`;

  // Stickers (até 3) no canto superior direito do banner
  const stickerSize = 56;
  const stickerY = 14;
  const stickerEls = d.stickerUrls
    .slice(0, 3)
    .map((url, i) => {
      const x = W - 20 - (i + 1) * (stickerSize + 8) + (stickerSize - stickerSize) / 2;
      return `<image href="${escapeXml(url)}" x="${x}" y="${stickerY}" width="${stickerSize}" height="${stickerSize}" preserveAspectRatio="xMidYMid meet" opacity="0.95"/>`;
    })
    .join("");

  const effectBadge = d.effectName
    ? `<g transform="translate(${W - 24 - 140}, ${H - 50})">
         <rect x="0" y="0" width="140" height="32" rx="16" fill="${glowColor}" opacity="0.18"/>
         <text x="70" y="21" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="13" font-weight="600" fill="${glowColor}">✨ ${escapeXml(truncate(d.effectName, 16))}</text>
       </g>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Profile card de ${name}">
  <defs>
    <clipPath id="cardClip"><rect x="0" y="0" width="${W}" height="${H}" rx="20"/></clipPath>
    <clipPath id="bannerClip"><rect x="0" y="0" width="${W}" height="180"/></clipPath>
    <clipPath id="avatarClip"><circle cx="${avatarCX}" cy="${avatarCY}" r="${avatarR}"/></clipPath>
    <linearGradient id="bannerGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f0f12"/>
      <stop offset="100%" stop-color="#18181c"/>
    </linearGradient>
    <linearGradient id="xpGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${glowColor}"/>
    </linearGradient>
    ${isLegendary ? `<filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : ""}
  </defs>

  <g clip-path="url(#cardClip)">
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#bgGrad)"/>
    ${bannerEl}
    <rect x="0" y="120" width="${W}" height="60" fill="url(#bannerGrad)" opacity="0.6"/>
    ${stickerEls}

    <!-- Avatar + frame -->
    <circle cx="${avatarCX}" cy="${avatarCY}" r="${avatarR + 4}" fill="#0f0f12" ${isLegendary ? 'filter="url(#goldGlow)"' : ""}/>
    ${avatarEl}
    ${frameEl}

    <!-- Nome + nível -->
    <text x="190" y="220" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="28" font-weight="700" fill="#fafafa">${name}</text>
    <g transform="translate(190, 232)">
      <rect x="0" y="0" width="86" height="26" rx="13" fill="${accent}" opacity="0.18"/>
      <text x="43" y="18" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="13" font-weight="600" fill="${accent}">Nível ${d.level}</text>
    </g>

    <!-- Barra de XP -->
    <g transform="translate(190, 270)">
      <rect x="0" y="0" width="${xpBarW}" height="14" rx="7" fill="#27272a"/>
      <rect x="0" y="0" width="${xpBarFill}" height="14" rx="7" fill="url(#xpGrad)"/>
      <text x="${xpBarW + 10}" y="11" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="11" font-weight="500" fill="#a1a1aa">${d.xpInLevel.toLocaleString("pt-BR")} / ${d.xpForNext.toLocaleString("pt-BR")} XP</text>
    </g>

    <!-- Bio -->
    ${bio ? `<text x="190" y="312" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="13" fill="#d4d4d8" font-style="italic">"${bio}"</text>` : ""}

    <!-- Stats inferiores -->
    <g transform="translate(190, 348)">
      <g>
        <text x="0" y="14" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="20">🪙</text>
        <text x="28" y="16" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="16" font-weight="700" fill="#fafafa">${d.totalBalance.toLocaleString("pt-BR")}</text>
        <text x="28" y="32" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="10" fill="#71717a">moedas</text>
      </g>
      <g transform="translate(180, 0)">
        <text x="0" y="14" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="20">⭐</text>
        <text x="28" y="16" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="16" font-weight="700" fill="#fafafa">${d.reputation.toLocaleString("pt-BR")}</text>
        <text x="28" y="32" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="10" fill="#71717a">reputação</text>
      </g>
    </g>

    ${effectBadge}

    <!-- Watermark Zenox -->
    <text x="${W - 16}" y="${H - 14}" text-anchor="end" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="10" font-weight="600" fill="${accent}" opacity="0.6">zenox</text>
  </g>
</svg>`;
}

export function buildFallbackSvg(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
  <rect width="800" height="400" rx="20" fill="#18181c"/>
  <text x="400" y="200" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" fill="#a1a1aa">${escapeXml(message)}</text>
  <text x="784" y="386" text-anchor="end" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="#fbbf24" opacity="0.6">zenox</text>
</svg>`;
}
