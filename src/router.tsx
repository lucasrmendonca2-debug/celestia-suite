import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * staleTime por prefixo de queryKey. Não tocamos nos callsites — só dizemos
 * ao QueryClient quanto cada tipo de dado vive antes de revalidar.
 *
 * Regra de bolso:
 *   - dados do Discord (cargos, canais, emojis, identidade): mudam raramente → 5 min
 *   - configs salvas pelo usuário: 30s (revalida ao trocar de aba)
 *   - listas de conteúdo (shop, badges, embeds, etc): 30s
 *   - stats/realtime (presença do bot, casos ativos): 15s
 *   - histórico/logs que mudam o tempo todo: 0 (sempre fresco)
 */
const STALE_TIME_BY_PREFIX: Record<string, number> = {
  // Discord resources — quase imutáveis em tempo de sessão
  "guild-roles": 5 * 60_000,
  "guild-channels": 5 * 60_000,
  "guild-emojis": 5 * 60_000,
  "my-guilds": 5 * 60_000,
  "bot-identity": 5 * 60_000,

  // Configurações dos módulos
  "guild-config": 30_000,
  "guild-overview": 30_000,
  "moderation-config": 30_000,
  "automod": 30_000,
  "community-config": 30_000,
  "social-config": 30_000,
  "ticket-config": 30_000,
  "level-config": 30_000,
  "leveling": 30_000,
  "economy": 30_000,
  "premium-config": 30_000,
  "dashboard-perms": 30_000,
  "logs": 30_000,

  // Listas de conteúdo
  "shop": 30_000,
  "embeds": 30_000,
  "badges": 30_000,
  "achievements": 30_000,
  "commands": 30_000,
  "autoroles": 30_000,
  "rr": 30_000,
  "multipliers": 30_000,
  "economy-missions": 30_000,
  "ticket-categories": 30_000,
  "ticket-access-levels": 30_000,
  "ticket-permission-roles": 30_000,
  "level-rewards": 30_000,
  "social-rewards": 30_000,
  "seasons": 30_000,
  "bot-assets": 30_000,

  // Stats / realtime
  "bot-presence": 15_000,
  "ticket-stats": 15_000,
  "ticket-active": 15_000,
  "moderation-stats": 15_000,
  "premium-status": 15_000,
  "premium-usage": 15_000,
  "leaderboard": 15_000,
  "social-lb": 15_000,
  "season-lb": 15_000,

  // Histórico volátil — sempre revalida
  "mod-cases": 0,
  "audit-logs": 0,
  "ticket-logs": 0,
  "social-logs": 0,
  "community-polls": 10_000,
  "community-suggestions": 10_000,
  "dashboard-audit": 10_000,
  "premium-audit": 10_000,
  "dev-logs": 0,
};

function applyDefaults(qc: QueryClient) {
  for (const [prefix, staleTime] of Object.entries(STALE_TIME_BY_PREFIX)) {
    qc.setQueryDefaults([prefix], {
      staleTime,
      gcTime: Math.max(staleTime * 4, 5 * 60_000),
    });
  }
}

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Padrão global pra qualquer query não listada acima
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
  applyDefaults(queryClient);

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
