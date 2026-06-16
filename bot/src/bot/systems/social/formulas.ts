/** Fórmula central do sistema social. Mantida isolada pra ajuste futuro. */

/** XP necessário pra passar do nível N pro N+1. */
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level + 1, 1.5));
}

/** XP total acumulado até atingir o início do nível N. */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 0; i < level; i++) total += xpForLevel(i);
  return total;
}

/** A partir do totalXp acumulado, deduz nível atual + xp no nível. */
export function deriveLevel(totalXp: number): { level: number; xpInLevel: number; xpForNext: number } {
  let level = 0;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
    if (level > 1000) break; // sanity
  }
  return { level, xpInLevel: remaining, xpForNext: xpForLevel(level) };
}
