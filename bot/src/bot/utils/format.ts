export function fmtCoins(amount: number, emoji = "💜", name = "Zen") {
  const n = new Intl.NumberFormat("pt-BR").format(Math.floor(amount));
  return `${emoji} **${n}** ${name}`;
}

export function fmtDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

/** Aceita: 10s, 5m, 2h, 3d, 1w */
export function parseDuration(input: string): number | null {
  const m = /^(\d+)\s*(s|m|h|d|w)$/i.exec(input.trim());
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult: Record<string, number> = { s: 1e3, m: 60e3, h: 3600e3, d: 86400e3, w: 604800e3 };
  return n * mult[unit];
}

/** Aplica variáveis estilo {user}, {server}, {memberCount}, {level}... */
export function applyVars(template: string, vars: Record<string, string | number | undefined | null>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v == null ? `{${k}}` : String(v);
  });
}
