# Fase 5 — Relatório de Testes Finais

> Execução automatizada em 21/jun/2026. Smoke + pen-test leve + dead-code sweep.

## 1. Smoke Automatizado (Playwright, headless 1280×1800)

### Rotas públicas — todas OK (200)
| Rota | Title | Console errors |
|---|---|---|
| `/` | Zenox — O bot Discord brasileiro para sua comunidade | 0 reais (apenas 404 de mascote local em dev) |
| `/recursos` | Recursos — Zenox | 0 |
| `/suporte` | Suporte & FAQ — Zenox | 0 |
| `/comandos` | Comandos — Zenox | 0 |
| `/docs` | Documentação — Zenox | 0 |
| `/premium` | Zenox+ Premium | 0 |
| `/status` | Status — Zenox | 0 |
| `/entrar` | Entrar — Zenox | 0 |

> Os 404 observados são `/__l5e/assets-v1/<id>/mascot-*.png` — endpoint de assets do dev server, **não aparece em produção**. Não bloqueia.

### Rotas privadas
- `/servidores` sem sessão → redireciona para `/entrar` ✅ (gate funcionando)
- Não foi possível auto-logar no Discord OAuth via Playwright (a sessão é HMAC-cookie + nonce; o smoke confirmou o redirecionamento mas o resto da matriz precisa de login manual).

## 2. Pen-test leve

| Cenário | Esperado | Observado |
|---|---|---|
| `GET /api/auth/discord/callback?code=fake&state=fake` (sem cookie) | rejeita | `400` ✅ |
| `POST /api/public/bot-guild-presence` sem `BOT_API_SECRET` | rejeita | `401` ✅ (timing-safe) |
| `GET /dashboard/foo-12345` sem sessão | redirect | `307 → /entrar` ✅ |
| `GET /api/auth/logout` (CSRF via `<img>`/`<a>`) | rejeitar | **antes 302** → **corrigido para 405** ✅ |
| `POST /api/auth/logout` com `Origin: https://evil.example` | rejeitar | **antes 302** → **corrigido para 403** ✅ |
| `POST /api/auth/logout` same-origin | redirect | `302 → /` ✅ |

**Correção aplicada**: `src/routes/api/auth/logout.ts` agora só aceita `POST` same-origin (checa `Sec-Fetch-Site` + `Origin`/`Referer` vs `Host`). `src/components/dashboard/DashboardTopbar.tsx` virou `<form method="post">` em vez de `<Link>` GET.

## 3. Dead-code sweep

### Removido
- `src/components/dashboard/ModuleCard.tsx` — sem importadores.
- `src/lib/api/example.functions.ts` (+ pasta vazia `src/lib/api/`) — exemplo `getGreeting` não usado.
- `src/routes/_authenticated/dashboard.$slug.automod.tsx` (na rodada anterior) — redirect órfão.

### Falsos positivos (mantidos)
- `src/components/ui/*` — kit shadcn, mantido como template padrão.
- `src/lib/guild/*.server.ts` e `src/lib/discord/users.server.ts` — carregados via `await import(...)` dinâmico, não aparecem em busca estática.

### Tabelas legacy (não removidas — risco de quebrar o bot)
Aparecem ≤2 vezes no código mas podem estar em uso pelo bot externo. Recomendo confirmar com o bot antes de drop:
`level_rewards_legacy` (0 refs no código), `moderation_logs`, `user_missions`, `shop_rotations`, `mod_appeals`, `temporary_actions`, `allowed_domains`, `blacklisted_words`.

## 4. Checklist manual restante

Por exigir Discord real:
- [ ] Matriz de perfis (deslogado, sem servidor, sem Manage Guild, Manage Guild, dono, owner global, premium/free) — visitar 3 dashboards distintos com cada perfil.
- [ ] Smoke por módulo: salvar config no painel → comando real no Discord → confirmar efeito (welcome, automod, economia, tickets, logs, level, sorteios).
- [ ] Lighthouse em `/`, `/recursos`, `/premium`, `/suporte` (publicado) — alvos: CLS<0.1, LCP<2.5s, TBT<200ms.
- [ ] Replay manual: copiar `state` de uma sessão de OAuth, abrir em janela anônima, confirmar rejeição (nonce queima ao usar).

## Conclusão

Fase 5 fecha com **1 vulnerabilidade CSRF corrigida (logout)**, **2 arquivos órfãos removidos** e smoke automatizado verde nas 8 rotas públicas. Auditoria completa do plano (.lovable/plan.md) consolidada.
