# Plano: Otimização do Dashboard (Fases 12–18)

Foco em **velocidade percebida**, **responsividade real em mobile**, **bundle menor** e **arquitetura mais escalável**. Ordenado por impacto/esforço.

## Diagnóstico atual

- ~20 rotas de dashboard, várias com 400–900 linhas (`tickets` 915, `social` 821, `economia` 743, `logs` 564, `index` 554).
- Todos os módulos são componentes inline no arquivo de rota → cada bundle de rota inclui form + tabs + tabelas + charts juntos.
- `recharts` (via `src/components/ui/chart.tsx`) é pesado e provavelmente carregado em rotas que mostram gráficos sem split.
- Mascote/banners em **PNG** servidos do R2 — sem WebP/AVIF, sem `loading="lazy"` consistente.
- Sidebar/topbar re-renderizam a cada navegação porque a lista de guilds não é compartilhada via context estável.
- `staleTime: 0` (default) em quase todas as queries — toda volta de aba refetcha tudo do Discord (lento e caro).
- Mobile: sidebar fixa + tabelas largas (logs, mod cases, tickets) sem scroll horizontal nem layout cartão.

---

## Fase 12 — Cache & freshness (impacto alto, 1 arquivo)

- Subir `defaultPreloadStaleTime` continua 0 (Query controla), mas configurar `staleTime` por tipo de dado:
  - `["my-guilds"]`: 5 min
  - `["guild-roles", id]` / `["guild-channels", id]` / `["bot-identity", id]`: 5 min
  - Configs de módulo (welcome, economy, etc): 30 s
  - Stats/realtime (mod-stats, tickets-stats): 15 s
- Centralizar em `src/lib/query/options.ts` com `queryOptions()` helpers nomeados — elimina duplicação e padroniza chaves.

## Fase 13 — Layout responsivo padronizado

- Auditar `ModuleLayout` + hero banners: aplicar `grid-cols-[minmax(0,1fr)_auto]` no header e `min-w-0` + `truncate` (segue regra `responsive-layout-patterns`).
- Tabelas grandes (logs, mod cases, tickets, shop) ganham:
  - container `overflow-x-auto` + `min-w-[720px]` na `<table>`
  - layout alternativo **card-stack** em `<sm` (cada linha vira um cartão)
- Sidebar: garantir `collapsible="offcanvas"` em mobile, `icon` em desktop, com `SidebarTrigger` sempre visível na topbar.
- Pickers (`ChannelSelect`/`RoleSelect`/`UserBadge`): forçar `flex-wrap` + chips com `max-w-full truncate`.

## Fase 14 — Code-splitting agressivo

- Extrair tabs pesadas dos arquivos de rota para módulos próprios em `src/components/dashboard/<modulo>/`:
  - `economia.tsx` → `EconomyGeneralTab`, `EconomyShopTab`, `EconomyMultipliersTab`, `EconomyMissionsTab`
  - `tickets.tsx` → mover tabs restantes pra `tickets/`
  - `social.tsx` → `SocialFeedTab`, `SocialProfilesTab`, `SocialConfigTab`
  - `index.tsx` (overview) → extrair `ActivityChart`, `QuickStats`, `RecentActivity`
- Lazy-import de Recharts em todos os charts (`const Chart = lazy(() => import('./Chart'))`) com `<Suspense fallback={<Skeleton/>} />`.
- Meta: nenhum arquivo de rota > 250 linhas.

## Fase 15 — Imagens & assets

- Adicionar `vite-imagetools` ao `vite.config.ts` (via `defineConfig({ vite: { plugins: [imagetools()] } })`).
- Migrar mascotes (`mascot-*.png`) + banners de economia/badges para `?format=webp&w=...` com fallback.
- `loading="lazy" decoding="async"` em todas as `<img>` que não são LCP (mascote do hero pode receber `fetchpriority="high"` via head().links da rota).
- Avatares de Discord (`cdn.discordapp.com`) — usar `?size=64` em vez de tamanho default.

## Fase 16 — UX feedback (percepção de velocidade)

- `pendingComponent` esqueleto por rota: cards/seções placeholder em vez de tela branca durante o loader.
- `SaveBar` global: detectar `dirty` automaticamente, mostrar barra flutuante no rodapé com "Salvar / Descartar" — elimina os 12+ botões "Salvar" copiados em cada módulo.
- Toast com undo nas mutações de delete (shop item, badge, mission, embed, multiplier).
- Prefetch agressivo: `<Link preload="intent">` em todos os itens do sidebar → carrega a rota no hover (já é padrão TanStack, garantir).

## Fase 17 — Server-side / N+1

- `listGuildRoles`/`listGuildChannels` provavelmente são chamados em **toda** página que tem picker. Cachear no servidor com KV/edge cache por 60s (header `Cache-Control: private, max-age=60`).
- Verificar com `supabase--slow_queries` se há queries lentas em `mod_cases`, `economy_transactions`, `level_users` e adicionar índices via migration.
- Overview do dashboard (`dashboard.$slug.index.tsx`): consolidar 5+ chamadas em uma única server fn `getDashboardOverview` que retorna tudo num JSON.

## Fase 18 — Polimento final

- `MessageResponse`/AI Elements no canto: nada a fazer (não é app de chat).
- Adicionar `<meta name="theme-color">` por rota.
- Auditoria Lighthouse mobile: meta CLS < 0.05, LCP < 2.5s, TBT < 200ms na rota `/dashboard/$slug/`.
- Remover imports não usados (especialmente `lucide-react`, hoje cada rota importa 6–10 ícones).

---

## Como executar

Cada fase é independente e pode ser feita em uma sessão. Sugestão de ordem por **maior ROI primeiro**:

1. **Fase 12** (cache) — ganho imediato, 1 arquivo
2. **Fase 13** (responsivo) — desbloqueia mobile
3. **Fase 15** (imagens) — corta peso do payload
4. **Fase 16** (UX feedback) — sensação de "instantâneo"
5. **Fase 14** (split) — bundle menor, exige refactor cuidadoso
6. **Fase 17** (server) — depende de medir gargalos reais
7. **Fase 18** (polimento)

Por qual quer começar?
