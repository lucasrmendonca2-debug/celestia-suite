# Auditoria Completa do Zenox Dashboard

> Modo somente-leitura. Nada foi modificado.

## Saúde Geral do Dashboard

| Camada | Estado | Comentário |
|---|---|---|
| Auth / sessão HMAC | 🟢 **Bom** | Cookie HMAC sólido, OAuth state assinado. Faltam pequenas defesas (CSRF replay, comparar state cookie×URL). |
| Autorização por servidor (Manage Guild / Owner) | 🟢 **Bom** | `assertCanManageGuild` consistente em quase todos os writes. 1 exceção em `permissoes`. |
| Validação de input | 🟠 **Parcial** | Nenhuma rota usa Zod no client; vários campos sem maxlength/regex; muitos IDs Discord livres. |
| Integração Dashboard → Bot | 🔴 **Crítico** | Risco arquitetural: bot pode estar lendo MongoDB enquanto dashboard escreve em Supabase. Várias tabelas legadas duplicadas. |
| UX de configuração | 🟠 **Parcial** | Muitos inputs de ID Discord onde já existem `ChannelSelect`/`RoleSelect`; ações destrutivas sem confirmação em 4 rotas. |
| Empty/loading/error states | 🟠 **Parcial** | 10 rotas com loader sem `errorComponent`; vários `useQuery` sem skeleton. |
| Premium / feature flags | 🔴 **Crítico** | Validado só no frontend, sem checagem em server fns de módulos. Compra "Em breve". |
| Sidebar × rotas existentes | 🟠 **Parcial** | `automod` e `niveis` existem mas não estão na sidebar; `cargos-reacao`, `temporadas`, `dev-logs` idem. |
| Performance / cache | 🟢 **Bom** | `STALE_TIME_BY_PREFIX` central; pequenas inconsistências locais. |
| SEO público | 🟠 **Parcial** | `blog`, `recursos`, `suporte`, `login` com `head()` incompleto. |

---

## Erros Críticos

### C1 — Bot usa MongoDB enquanto dashboard grava em Supabase
- **Local:** arquitetura geral; secret `MONGO_URI` existe mas não é lido no repo do dashboard.
- **Arquivo provável:** repositório separado do bot (não auditado).
- **O que acontece:** configurações salvas no painel (welcome, automod, economia, tickets, logs, level) podem não chegar ao bot.
- **Impacto usuário:** módulo aparenta funcionar (toast de sucesso) mas o bot ignora.
- **Impacto técnico:** divergência permanente de estado; dois caminhos de truth.
- **Prioridade:** P0.
- **Correção:** confirmar fonte única (Supabase) no bot, ou criar webhook/fila para propagar mudanças. Mapeamento por módulo na seção **Mapa Dashboard → Banco → Bot** abaixo.
- **Teste:** salvar `welcome_message`, conferir via `/welcome` no Discord; idem com cada módulo.

### C2 — Permissões do dashboard sem gate server-side por guild
- **Local:** `src/routes/_authenticated/dashboard.$slug.permissoes.tsx:71-99` + server fns relacionadas.
- **O que acontece:** `upsertDashboardPermission` aceita qualquer `guildId` que o usuário gerencie globalmente; faltaria verificar permissão *naquele* servidor específico via `assertCanAccessArea`.
- **Impacto:** dono de servidor A pode (em teoria) gravar permissão em servidor B se o request for forjado, dependendo da implementação de `requireUser()` vs `assertCanManageGuild`.
- **Prioridade:** P0.
- **Correção:** auditar a server fn `upsertDashboardPermission` e garantir `assertCanManageGuild(guildId)` antes do upsert.
- **Teste:** logar com usuário sem Manage Guild em servidor X e tentar chamar via DevTools/curl `upsertDashboardPermission({guildId: 'X', ...})` — deve retornar 403.

### C3 — `BOT_OWNER_ID` ausente nas secrets
- **Local:** `src/lib/admin/premium-admin.functions.ts:17`.
- **O que acontece:** painel `/admin/premium` lança "Acesso restrito ao owner" para todos (falha-segura), mas owner real não consegue entrar.
- **Prioridade:** P0.
- **Correção:** adicionar secret `BOT_OWNER_ID` + guard explícito `if (!ownerId) throw`.
- **Teste:** logar como owner e abrir `/admin/premium`.

### C4 — `DISCORD_BOT_TOKEN` ausente nas secrets
- **Local:** `src/lib/discord/bot-token.server.ts:4`; `src/routes/api/public/bot-guild-presence.ts:40`.
- **O que acontece:** `assertCanAccessArea` (roles do membro) sempre retorna vazio; heartbeat do bot cai no fallback Discord API (lento, falha externa) ou rejeita.
- **Prioridade:** P0.
- **Correção:** adicionar secret `DISCORD_BOT_TOKEN`.

### C5 — Premium validado só no frontend
- **Local:** `dashboard.$slug.premium.tsx` (renderização de features); módulos consumidores não checam plano ativo.
- **O que acontece:** usuário pode habilitar/usar feature premium em servidor free via mutation direta.
- **Prioridade:** P0.
- **Correção:** em cada server fn de feature premium chamar `checkPremiumLimit(guildId, feature)` antes de gravar.
- **Teste:** servidor sem premium tentar setar 6 multiplicadores quando FREE_LIMITS=3 — deve recusar no servidor.

### C6 — Inputs de ID Discord manual onde existem seletores
Rotas com IDs livres em vez de `ChannelSelect`/`RoleSelect`/member picker:
- `niveis.tsx:221, 253-270, 294-297` — canal levelup, canais/cargos sem XP, cargos de recompensa.
- `social.tsx:310-323, 333-335, 397-401, 569-571` — canais ignorados, log channel, level-up channel, cargo de recompensa.
- `comunidade.tsx:402-409, 447-464` — canal de log e canal de sugestões.
- `premium.tsx:411-425` — cargos VIP/Premium.
- `badges.tsx:301-305` — userId para grant/revoke.
- `cargos-reacao.tsx:152-155` — ID da mensagem (manual ok, mas sem validação snowflake).
- **Impacto:** UX ruim, alta taxa de erro (cargo/canal apagado, ID copiado errado, sem feedback).
- **Prioridade:** P1.
- **Correção:** trocar por `ChannelSelect`/`RoleSelect` existentes; para userId usar autocomplete via API do bot (`/api/guild/:id/members?search=...`).

### C7 — Campo `protected_user_ids` enviado ao servidor mas sem UI
- **Local:** `dashboard.$slug.moderacao.tsx:216`.
- **O que acontece:** lista sempre vazia, usuário não consegue proteger ninguém.
- **Prioridade:** P1.
- **Correção:** adicionar input multi-tag para userIds.

### C8 — Ações destrutivas sem confirmação
- `temporadas.tsx:238-240` — "Encerrar temporada" (irreversível).
- `comunidade.tsx:263-270` — cancelar enquete.
- `comunidade.tsx:347-352` — reprovar sugestão.
- `badges.tsx:340-346` — revogar badge.
- **Prioridade:** P1.
- **Correção:** usar `ConfirmDeleteButton` ou `AlertDialog`.

### C9 — `automod` é apenas redirect para `/moderacao` e fica fora da sidebar
- **Local:** `dashboard.$slug.automod.tsx:3-9`; `niveis` idem (existe mas não está na sidebar).
- **Impacto:** usuário não acessa via UI; links antigos quebram silenciosamente.
- **Prioridade:** P1.
- **Correção:** decidir — incorporar como tab em `moderacao` e remover arquivo, OU adicionar à sidebar.

### C10 — Callback OAuth aponta para `/dashboard` inexistente e perde `?next=`
- **Local:** `api/auth/discord/callback.ts:57`; `api/auth/discord/login.ts:16-17`.
- **O que acontece:** após login usuário aterra em rota 404; perda do destino original.
- **Prioridade:** P1.
- **Correção:** redirecionar para `/servidores` ou para `next` validado; propagar `?next=location.href` em todos os CTAs que disparam login.

---

## Erros Médios

| # | Local | Problema | Correção |
|---|---|---|---|
| M1 | `api/auth/discord/callback.ts:34` + `discord.server.ts` | State OAuth stateless permite replay dentro de 10 min e não compara cookie×URL | Persistir nonce usado (Supabase tabela `oauth_states`) e comparar cookie state ≡ URL state |
| M2 | `premium-admin.functions.ts:17` | `BOT_OWNER_ID === ""` poderia bater com `userId === ""` | Guard `if (!ownerId) throw` |
| M3 | `guild/premium.functions.ts:redeemGuildCode` | Race em `used_count` (sem transação) | Criar RPC SQL atômica `redeem_premium_code` |
| M4 | `bot-presence.ts:37` | Comparação de token sem `timingSafeEqual` | Trocar por `crypto.timingSafeEqual` |
| M5 | `boas-vindas.tsx:199-208, 244-250` | Sem maxlength em mensagem (Discord 2000) e sem validação hex de cor | Adicionar Zod + `maxLength` + `<input type="color">` |
| M6 | `comandos-bot.tsx:103, 231, 261-268` | `required_roles: []` hardcoded; `description`/`response_text` sem maxlength | Adicionar `MultiRoleSelect` + limites Discord |
| M7 | `moderacao.tsx:217` | `embed_color = Number("")` vira 0 | Trocar por `<input type="color">` e validar fallback |
| M8 | `tickets.tsx:460-470, 587-610` | Switches "transcript"/"avaliação" salvam mas bot não usa; URLs sem validação | Marcar como `disabled` até implementação OU implementar no bot; validar URLs |
| M9 | `niveis.tsx:382-384`, `social.tsx:619`, `temporadas.tsx:307` | Leaderboards mostram `user_id` raw | Resolver username via Discord API (cache) e exibir avatar |
| M10 | `logs.tsx:478, 519-531`; `permissoes.tsx:84`; `social.tsx` | Sem paginação (limit fixo 50/200) e sem skeleton em `useQuery` | Implementar paginação cursor/`offset` + `pendingComponent` |
| M11 | `comunidade.tsx:65-74` | `polls_allow_anonymous`/`suggestions_allow_anonymous` no tipo mas sem UI | Adicionar switches |
| M12 | `social.tsx:303-305, 564` | Switch "Conquistas (Pass 2)" e recompensa "badge" salvam mas sem efeito | Desabilitar/ocultar até backend pronto |
| M13 | `premium.tsx:269` | Botões "Em breve" nos planos sem ação | Integrar gateway (Stripe/Paddle) ou ocultar planos não compráveis |
| M14 | 10 rotas listadas (logs, niveis, badges, conquistas, temporadas, cargo-automatico, embeds, assets, permissoes, premium) | Sem `errorComponent` próprio | Adicionar `errorComponent` com botão "Tentar novamente" (`router.invalidate()`) |
| M15 | `social.tsx:748` | Redefine `SaveBar` local divergente do componente canônico | Importar `@/components/dashboard/SaveBar` |
| M16 | `AutomodTab.tsx:131` | `setQueryData` sem `invalidateQueries` (otimista pode dessincronizar) | Adicionar `qc.invalidateQueries` em `onSettled` |
| M17 | `conquistas.tsx:263-264` | `description: a.title` mas campo é `a.name` (undefined) | Trocar para `a.name` |
| M18 | `assets.tsx:288`, `tickets.tsx:587` | Inputs de URL sem `type="url"`/zod | Adicionar validação |
| M19 | `economia.tsx:326-357, 462` | Valores `daily/work/cooldown` sem `min/max` server-side; `slug` sem regex | Validar com Zod no handler |
| M20 | `dev-logs/admin.server.ts:8` | `DEV_LOG_ADMIN_IDS` ausente → bloqueia em silêncio | Mostrar tela "Configuração incompleta" para owner |
| M21 | `docs.tsx:36` | CTA "Painel" sem `?next=` | Propagar |
| M22 | `servidores.tsx:45` | `notFoundComponent` cru, sem estilo | Trocar por componente padrão com mascot |
| M23 | `index.tsx:165` | Denominador `/6` fixo | Calcular módulos ativos dinamicamente |

---

## Erros Pequenos

| # | Local | Problema |
|---|---|---|
| P1 | `entrar.tsx:34` | Texto "discord control node" em inglês |
| P2 | `DashboardSidebar.tsx:27` | "aurora console" em inglês |
| P3 | `admin.premium.tsx:114` | Badge "Owner only" em inglês |
| P4 | `cargos-reacao.tsx:56,183` | "Toggle" misto PT/EN |
| P5 | `blog.tsx` | Sem `head()`, só redirect |
| P6 | `recursos.tsx`, `suporte.tsx`, `login.tsx` | OG/title incompletos |
| P7 | `economia.tsx:475,604` | `<select>` nativo em meio a `shadcn/Select` |
| P8 | `embeds.tsx:99` | Botão Salvar sem dirty tracking |
| P9 | `cargo-automatico.tsx` | Sem feedback de limite (premium) |
| P10 | `staleTime` local em `DashboardSidebar:13`, `DiscordBadges:29`, `RoleSelect:37` | Conflita com `router.tsx` |
| P11 | Vários | Falta `maxLength` em `name`/`code`/`emoji`/`icon_url` |
| P12 | `logout.ts` GET | Sem CSRF (impacto baixo) |
| P13 | `premium.functions.ts:54-58` | Usa anon key isoladamente (inconsistente, mas seguro) |
| P14 | Múltiplos `.server.ts` | Import estático de `supabaseAdmin` (ok em Node, custo em Edge) |

---

## Funcionalidades Falsas ou Parciais

1. **Tickets:** switches "Gerar transcript" e "Pedir avaliação" salvam estado mas bot não processa (`tickets.tsx:460-470`).
2. **Social:** switch "Conquistas (Pass 2)" e recompensa tipo "badge" (`social.tsx:303, 564`).
3. **Premium:** todos os botões "Em breve" de compra; benefícios marcados mas não enforcados nos módulos consumidores.
4. **Comandos-bot:** `required_roles` sempre `[]` (sem UI para configurar).
5. **Moderação:** `protected_user_ids` salvado vazio (sem UI).
6. **Index do servidor:** card "Análise do Zenox" é só agregado visual, sem IA.
7. **Embeds:** templates podem ser salvos mas não há "Enviar para canal" — sem efeito prático.
8. **Logs:** filtros aceitam IDs sem autocomplete; histórico limit 200 fixo.
9. **Dashboard permissões:** painel existe, mas o bot pode não consultar `dashboard_permissions` se C1 (Mongo) for confirmado.
10. **Cargo automático / Cargos-reação:** sem validação de limite premium nem feedback se bot perder permissão `Manage Roles`.

---

## Pontas Soltas

**Arquivos / componentes sem uso aparente**  
- `src/lib/api/example.functions.ts` (template).  
- `src/components/dashboard/aurora-ui.tsx` (verificar referência).

**Rotas existentes fora da sidebar**  
- `dashboard.$slug.automod.tsx` (apenas redirect)  
- `dashboard.$slug.niveis.tsx`  
- `dashboard.$slug.cargos-reacao.tsx`  
- `dashboard.$slug.temporadas.tsx`  
- `_authenticated/dev-logs.tsx`  
- `_authenticated/admin.premium.tsx` (intencional, owner-only)  
- `_authenticated/g.$guildId.tsx` + `g.$guildId.$.tsx` (alias?)

**Rotas duplicadas**  
- `/entrar` × `/login` — confirmar qual é canônica.  
- `dashboard.$slug.niveis` × `dashboard.$slug.social` (overlap forte).  
- `dashboard.$slug.automod` redireciona a `moderacao` mas continua no roteador.

**Tabelas mortas no Supabase (zero references)**  
`allowed_domains`, `blacklisted_words`, `command_permissions`, `level_rewards_legacy`, `leveling_config_legacy`, `moderation_logs` (usa `mod_cases`), `premium_feature_usage`, `reputation_logs`, `suggestion_votes`, `temporary_actions`, `user_levels_legacy`, `user_missions`.

**Secrets órfãs**  
`APP_URL`, `MONGO_URI`, `LOVABLE_API_KEY` — nenhuma referência no código.

**Secrets esperadas mas ausentes**  
`BOT_OWNER_ID`, `DISCORD_BOT_TOKEN`, `DEV_LOG_ADMIN_IDS`.

**TODOs / "próxima fase" visíveis ao usuário**  
`tickets.tsx:460-470`, `social.tsx:303, 564`, `premium.tsx:269` — mover para flags ocultas ou implementar.

---

## Mapa Dashboard → Banco → Bot

| Módulo | Página | Tabela Supabase | Server fn | Bot lê (esperado) | Status |
|---|---|---|---|---|---|
| Welcome | `boas-vindas` | `guild_configs` | `updateWelcomeConfig` | igual? | ⚠️ depende de C1 |
| Autorole | `cargo-automatico` | `guild_autoroles` | `addAutorole/removeAutorole` | igual? | ⚠️ |
| Logs | `logs` | `guild_logs_config` + `server_audit_logs` | `updateLogsConfig` | igual? | ⚠️ |
| Tickets | `tickets` | `ticket_configs` + `ticket_categories` + `ticket_*` | `updateTicketConfig` etc. | igual? | ⚠️ parcial (transcript/rating) |
| Moderação | `moderacao` | `moderation_configs` + `mod_cases` | `updateModerationConfig` | bot pode usar `moderation_logs` (morta no dashboard) | 🔴 |
| AutoMod | `moderacao` (subtab) | `automod_config` | `updateAutomodConfig` | igual? | ⚠️ |
| Economia | `economia` | `economy_config` + `shop_items` + `economy_missions` + `guild_multipliers` | mutations correspondentes | bot deve usar `user_economy` + `economy_transactions` | ⚠️ |
| Loja | `economia` | `shop_items` + `shop_rotation_config` | upsert/remove | igual | ⚠️ |
| Inventário | (sem página dedicada) | `user_economy` | — | — | ❌ não exposto |
| Level | `niveis` | `level_config` + `level_rewards` + `level_users` | `updateLevelingConfig` | bot deve usar igual | ⚠️ tabela `level_rewards_legacy` órfã |
| Social | `social` | `social_config` + `social_profiles` + `level_*` | mutations | bot? | ⚠️ |
| Premium | `premium` / `admin.premium` | `premium_*` (plans/subscriptions/activations/codes) | `redeemGuildCode` etc. | bot precisa consultar para enforcar | 🔴 sem enforcement |
| Comandos custom | `comandos-bot` | `custom_commands` | `upsert/remove` | igual | ⚠️ `required_roles` sempre vazio |
| Permissões | `permissoes` | `dashboard_permissions` | upsert/remove | só dashboard, ok | ⚠️ falta gate (C2) |
| Cargos-reação | `cargos-reacao` | `reaction_roles` | add/remove | bot escuta reações? | ⚠️ |
| Enquetes | `comunidade` (Polls) | `polls` (+ `poll_votes` órfão?) | `cancelPoll` | bot cria? | ⚠️ |
| Sugestões | `comunidade` (Sugg) | `suggestions` (+ `suggestion_votes` órfão) | `updateSuggestionStatus` | bot escuta? | ⚠️ |
| Embeds | `embeds` | `embed_templates` | upsert/remove | bot envia? | ❌ sem "enviar" |
| Assets | `assets` | `bot_assets` | upsert/remove | bot consome via URL | ⚠️ |
| Badges | `badges` | `badges` + `user_badges` | upsert/grant/revoke | bot exibe em comando? | ⚠️ |
| Conquistas | `conquistas` | `achievements` + `user_achievements` | upsert/delete | bot? | ⚠️ |
| Temporadas | `temporadas` | `level_seasons` + `level_season_users` | create/setActive/end/delete | bot? | ⚠️ |
| Sorteios | — | sem tabela detectada | — | — | ❌ módulo inexistente apesar de citado |

Legenda: 🟢 confirmado, ⚠️ depende de confirmação do bot (C1), 🔴 inconsistência conhecida, ❌ ausente.

---

## Plano de Correção (por Fases)

### Fase 1 — Erros Críticos (P0)
1. **C1**: definir fonte única (Supabase) e/ou propagar mudanças ao bot via webhook; remover `MONGO_URI` se for legado, ou documentar bridge.
2. **C3 + C4**: adicionar secrets `BOT_OWNER_ID` e `DISCORD_BOT_TOKEN`; guard `if (!ownerId)`.
3. **C5**: introduzir `requirePremiumFeature(guildId, feature)` chamado em toda server fn premium (multipliers extras, embed templates ilimitados, etc.).
4. **C2**: confirmar `assertCanManageGuild(guildId)` em `upsertDashboardPermission`/`removeDashboardPermission` (e em qualquer outra mutation que aceite `guildId` como parâmetro arbitrário).
5. **C10**: corrigir redirect pós-login (`/servidores` ou `next` validado); propagar `?next=` em todos os CTAs públicos.

### Fase 2 — Integração Dashboard ↔ Bot (P0/P1)
1. Mapear cada tabela do dashboard para o consumidor real no bot (planilha).
2. Eliminar tabelas legacy (`*_legacy`, `moderation_logs`, `user_missions`, etc.) após migração.
3. Implementar (ou desabilitar visualmente) features marcadas "próxima fase": tickets transcript/rating, social Pass 2, embeds "enviar".
4. Enforcement de premium e `required_roles` de comandos.
5. Adicionar canal de invalidação de cache no bot quando o dashboard salva (Supabase Realtime ou pub/sub).

### Fase 3 — Permissões e Segurança (P1)
1. State OAuth não-replayable (persistir nonce, comparar cookie×URL).
2. `timingSafeEqual` no `bot-guild-presence`.
3. RPC SQL atômica para `redeem_premium_code`.
4. Auditoria server-side em toda mutation: `assertCanAccessArea` quando área tem permissão granular.
5. Tabela `oauth_states` + limpeza.
6. Rate limit em `/api/auth/discord/login` e `/api/auth/logout` (CSRF via POST + token).

### Fase 4 — UX e Visual (P1/P2)
1. Substituir todos os inputs de ID livre por `ChannelSelect`/`RoleSelect`/member picker (C6).
2. Adicionar `protected_user_ids` UI e `required_roles` UI (C7, M6).
3. Confirmação em todas as ações destrutivas (C8).
4. `errorComponent`/`pendingComponent` em 10 rotas (M14).
5. Resolver usernames em leaderboards (M9) com avatar+username via `/users/{id}` em batch + cache 24h.
6. Paginação cursor em logs/leaderboards (M10).
7. Validação Zod no client + maxlength por campo (P11).
8. Limpeza textual PT-BR (P1–P4) e SEO completar `head()` (P5–P6).
9. Página 404 e "acesso negado" padronizadas (M22, B8–B10).
10. Sidebar consistente com rotas existentes (C9, fora-da-sidebar).
11. Consolidar `niveis` e `social` (ou separar com clareza visual).
12. Remover `automod.tsx` redirect ou integrá-lo.

### Fase 5 — Testes Finais
1. **Matriz de perfis** (deslogado, sem servidor, sem Manage Guild, Manage Guild, dono, owner global, servidor sem bot, sem permissão, premium, free, VIP, não-VIP) — Playwright em headless para cada rota crítica.
2. **Smoke por módulo**: salvar config → verificar no Supabase → invocar comando no Discord → confirmar efeito.
3. **Lighthouse** em rotas públicas (CLS, LCP, TBT).
4. **Pen-test leve**: tentar mutation com `guildId` que o usuário não administra; tentar replay de state OAuth; tentar logout via GET cross-origin.
5. **Dead-code sweep** após Fases 2–4: remover tabelas, secrets órfãs, arquivos não referenciados.

---

## Próximo passo sugerido

Começar pela **Fase 1**, em particular C1/C4 que destravam quase tudo do bot, e C2/C5 que fecham as brechas reais de privilégio. Ao final desta fase, executar a matriz da Fase 5 reduzida só nos módulos tocados.