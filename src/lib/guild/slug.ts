/**
 * Slugs de servidor para URLs do dashboard.
 *
 * Formato: `<kebab-do-nome>-<últimos 7 dígitos do guildId>`.
 * O sufixo numérico é a fonte de verdade — extraímos o guildId real dele.
 */

export function buildGuildSlug(input: { id: string; name: string }): string {
  const kebab = input.name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = input.id.slice(-7);
  return kebab ? `${kebab}-${suffix}` : suffix;
}

/**
 * Recupera o guildId a partir de um slug.
 * Recebe a lista de guilds conhecida do usuário para casar pelo sufixo de 7 dígitos.
 * Se o slug for ele mesmo um guildId puro (compat: links antigos `/g/<id>`),
 * devolvemos como está.
 */
export function resolveGuildIdFromSlug(
  slug: string,
  guilds: ReadonlyArray<{ id: string }>,
): string | null {
  if (/^\d{5,30}$/.test(slug)) return slug;
  const suffix = slug.match(/(\d{5,})$/)?.[1];
  if (!suffix) return null;
  const match = guilds.find((g) => g.id.endsWith(suffix));
  return match?.id ?? null;
}

/** Extrai o sufixo numérico do slug sem consultar lista (uso em chamadas server-fn). */
export function guildIdSuffix(slug: string): string | null {
  if (/^\d{5,30}$/.test(slug)) return slug;
  return slug.match(/(\d{5,})$/)?.[1] ?? null;
}
