
# Auditoria Técnica — Zenox (bot + dashboard + Supabase)

Escopo: leitura apenas. Nenhum arquivo foi alterado. Findings agrupados por severidade. Cada item lista: o que está errado, arquivos, motivo técnico e como corrigir.

---

## P0 — Bloqueia produção, perde dados ou abre brecha de segurança

### P0-1. Bot ainda fala "Mongoose" mas o backing é Supabase via shim — operações `$inc` não-atômicas em economia
- Arquivos: `bot/src/database/models.ts` (shim), `bot/src/bot/commands/economy/shop.ts`, `rob.ts`, `pay.ts`, `work.ts`, `crime.ts`, `bot/src/http/server.ts` (`handleClaim`).
- Problema: o próprio cabeçalho do shim avisa: "`$inc` é read-modify-write (não atômico)". `shop.ts` (linha ~206-219) e `rob.ts` (linha ~95-103) chamam `EconomyAccount.findOneAndUpdate({ wallet: { $gte: total } }, { $inc: { wallet: -total } })` confiando em atomicidade — o shim faz SELECT+UPDATE separados sobre `user_economy`. Sob concorrência (dois `/loja comprar` ou `/roubar` ao mesmo tempo) → saldo negativo, estoque negativo, double-spend.
- Risco: economia inteira corrompível em segundos por usuário malicioso com dois clientes.
- Correção: trocar TODOS os caminhos "atômicos" do bot por RPC Supabase já existente — `economy_debit_wallet`, `economy_credit_wallet`, `economy_transfer_wallet`. Para `lastDaily`, `lastRob`, `lastCrime`, `lastWork` criar uma RPC nova `economy_claim_cooldown(_guild_id, _user_id, _field, _cutoff)` que faça UPDATE atômico com `WHERE last_x IS NULL OR last_x <= cutoff`. Estoque da loja: RPC `shop_buy_atomic(_guild_id, _user_id, _item_id, _qty, _unit_price)` que decremente `shop_items.stock` e `user_economy.balance` no mesmo bloco PL/pgSQL.

### P0-2. `handleClaim` do /daily HTTP bridge tem janela de race entre cooldown e crédito
- Arquivo: `bot/src/http/server.ts` linhas ~120-180.
- Problema: claim faz (1) `findOneAndUpdate` para travar `lastDaily` → (2) recalcula bônus → (3) novo `findOneAndUpdate` com `$inc wallet`. Entre 1 e 3 outro processo pode ler `streakDaily` antigo, ou o segundo update falha silenciosamente e o usuário fica com cooldown gravado SEM ter recebido moedas.
- Correção: criar RPC `daily_claim(_guild_id, _user_id, _amount, _streak)` que faça em transação: travar cooldown + creditar wallet + setar streak — retornando novo balance. Se falhar, rollback no Supabase.

### P0-3. `supabase-admin.server.ts` cai pra publishable key silenciosamente — exposição de RPC privadas
- Arquivo: `src/lib/supabase-admin.server.ts`.
- Problema: o wrapper aceita `SUPABASE_PUBLISHABLE_KEY` como fallback de `SERVICE_ROLE`. Qualquer server fn que assuma "estou bypassando RLS" passa a rodar como `anon`. Em código onde `supabaseAdmin` insere em tabelas que confiam em service_role (ex.: `server_audit_logs`, `premium_audit_log`, `premium_subscriptions`), o insert vai falhar OU pior — bater em policies anon-friendly que não deveriam aceitar isso. Diretiva oficial do projeto (`server-side-modern`) proíbe esse fallback.
- Correção: remover o fallback. Lançar erro claro. Server fns públicas devem usar o client publishable explicitamente (`createClient` com `SUPABASE_PUBLISHABLE_KEY`), não `supabaseAdmin`.

### P0-4. `marriages` é global (sem guildId) — abuso cross-server
- Arquivos: `bot/src/bot/commands/interaction/marry.ts`, `divorce.ts`, schema `marriages` no Supabase.
- Problema: já documentado em `bot/AUDIT.md` como item em aberto. Casamento de um servidor aparece em todos.
- Correção: definir intenção com o usuário. Se for por guild → migration adicionando `guild_id text not null`, backfill com `'global'` ou mover para tabela nova.

### P0-5. `apelacoes.ts` usa capability `can_warn` para aprovar apelações
- Arquivo: `bot/src/bot/commands/moderation/apelacoes.ts:46` (já listado em AUDIT).
- Problema: qualquer mod com permissão de warn aprova/rejeita ban de outro mod. Escalonamento de privilégio.
- Correção: adicionar capability `can_manage_appeals` em `moderation_permission_roles` + migration + checar nessa rota.

### P0-6. `BOT_API_URL` ausente do `.env.example` do dashboard
- Arquivos: `.env.example`, `src/lib/daily.functions.ts`.
- Problema: o código tem fallback hardcoded para `52.67.80.142:8080` (IP de produção numa AWS!) — código `botBaseCandidates`. Em qualquer fork/preview/dev sem `BOT_API_URL` setado, requisições vão pra IP público de produção. Vazamento de tráfego + risco de cross-environment writes.
- Correção: remover fallback hardcoded; documentar `BOT_API_URL` e `BOT_API_SECRET` no `.env.example`. Em dev, exigir env explícito ou retornar `{ error: "bot_not_configured" }`.

---

## P1 — Bugs reais, inconsistências, UX quebrada

### P1-1. `src/data/commands.json` está desatualizado vs comandos reais do bot
- Arquivos: `scripts/build-commands-json.mjs`, `src/data/commands.json`, `bot/src/bot/commands/**`.
- Verificado: JSON lista 74 comandos. Pasta `economy/` tem 13 arquivos, mas o JSON cobre só parte (`balance`, `inventory`, `top`, `withdraw` faltam — JSON usa nomes localizados PT). Script lê o primeiro `setName(...)` no source — pega o slug PT, mas comandos como `balance.ts` definem `setName("saldo")` então funciona. Falta: rodar o script no CI/build (não está no `package.json` build pipeline) → JSON fica defasado em cada PR.
- Correção: adicionar `node scripts/build-commands-json.mjs` no `prebuild` do dashboard e/ou no commit hook. Validar contagem vs `loadCommands` runtime.

### P1-2. Página pública `/comandos` pode mostrar comando que não existe mais
- Mesma raiz do P1-1. Sem fonte da verdade — JSON é cache estático.
- Correção alternativa: server fn `getCommandsCatalog()` que importa dinamicamente o `src/data/commands.json` E valida via heartbeat do bot (`bot_guild_presence` ou nova tabela `bot_commands_manifest` populada pelo bot no ready).

### P1-3. `kick.ts` não cria `mod_case` (todos outros criam)
- Já listado em `bot/AUDIT.md`. Histórico de moderação fica com lacuna. Correção: importar `createCase` e chamar pós-`member.kick()`.

### P1-4. `warn.ts` auto-escalação ignora `canPunishTarget` e `createCase`
- Já listado em AUDIT. Risco de bypass de hierarquia em auto-ban por pontos.

### P1-5. `ticket.service.ts setPanelMessage` sem `upsert`
- Servidores sem `ticket_configs` prévio não gravam `panel_message_id`. Correção: trocar `.update()` por `.upsert(..., { onConflict: "guild_id" })`.

### P1-6. Migration de tabelas sem GRANT explícito (risco PostgREST)
- Diretiva do projeto exige GRANT em toda CREATE TABLE pública. Várias migrations antigas em `supabase/migrations/` precisam ser auditadas — sem alterar as antigas, criar migration `*_grants_audit.sql` que rode `GRANT SELECT, INSERT, UPDATE, DELETE ON ... TO authenticated` + `GRANT ALL ON ... TO service_role` para tabelas que estiverem faltando, usando o loop seguro do guia `data-api-permission-denied`. Sintoma típico: query do dashboard retorna vazia mesmo logado.

### P1-7. `/comandos`, `/recursos`, `/blog`, `/status`, `/suporte`, `/docs` — checar `head()` único e og:image
- Diretiva TanStack: cada rota pública tem `head()` próprio. Verificar se cada uma define `title` / `description` / `og:image` distintos. (Não conferido nesta passada — necessita revisão.)

### P1-8. `bot/README.md` desatualizado
- Header diz "MongoDB + Mongoose" e "prisma/schema.prisma" — bot já migrou para Supabase via shim. Confunde devs novos. Correção: reescrever a seção Stack e estrutura.

### P1-9. Tooling: `bot/README.md` lista `/balance`, `/work`, etc. (slugs EN) mas registro real é PT (`/saldo`, `/trabalhar`). Atualizar a tabela de comandos no README.

### P1-10. `daily.functions.ts` lista fallback de bot incluindo IP/host fixo
- Mesmo do P0-6 mas perspectiva UX: usuário em preview vê erro "Use um novo /daily após o bot reiniciar na porta 8080" — mensagem enganosa porque pode ser problema de env, não de porta.

### P1-11. Race em `level_users` ao processar XP por mensagem
- Bot processa XP via read-modify-write (verificar `bot/src/bot/systems/level/`). Risco mesmo padrão de P0-1 mas menos crítico (perda eventual de XP). Correção: RPC `level_add_xp(_guild_id, _user_id, _amount)`.

---

## P2 — Polimento, deprecation, dívida técnica

- P2-1. ~50 ocorrências de `ephemeral: true` no bot — deprecated em discord.js v14.16+. Substituir por `flags: MessageFlags.Ephemeral` em mass refactor.
- P2-2. `commands/utility/lembrete.ts` sem limite de lembretes por usuário (spam DM).
- P2-3. `commands/config/logs.ts:161` aceita Snowflakes inválidos.
- P2-4. `commands/config/embed.ts:52-55` URLs sem validação `^https?://`.
- P2-5. `level.ts addxp -qty` pode gerar XP negativo se o serviço não fizer clamp.
- P2-6. `levelreward.ts:41-53` DELETE+INSERT sem upsert (janela de inconsistência).
- P2-7. `crime.ts:36` seta `lastCrime` antes de `getAsset` — se este lançar, cooldown não persiste.
- P2-8. Vários `void promise` sem `.catch` em `pay.ts`, `work.ts` etc.
- P2-9. Documentar no README do dashboard que a página `/cosmetics-preview` é interna (dev-only), ou esconder atrás de auth.
- P2-10. Logs do `supabase-admin` warning só uma vez por processo — em runtime serverless cada cold start re-avisa; aceitar ou suprimir.

---

## Plano de correção por etapas

### Etapa A (P0 obrigatórios — sem novo design, só backend)
1. Migration nova: RPCs `economy_claim_cooldown`, `shop_buy_atomic`, `daily_claim_atomic`, `level_add_xp`.
2. Reescrever `bot/src/bot/commands/economy/{shop,rob,pay,work,crime}.ts` e `bot/src/http/server.ts handleClaim` para usar essas RPCs.
3. Remover fallback de publishable key em `src/lib/supabase-admin.server.ts`. Onde quebrar, trocar pra `createPublicClient()` server-local.
4. Remover IPs hardcoded de `src/lib/daily.functions.ts`. Adicionar `BOT_API_URL`/`BOT_API_SECRET` ao `.env.example`.
5. Decidir P0-4 (marriages) com usuário. Se for por-guild: migration `ALTER TABLE marriages ADD COLUMN guild_id text` + backfill + ajustar comandos.
6. Adicionar capability `can_manage_appeals` + migration + aplicar em `apelacoes.ts`.

### Etapa B (P1)
1. Adicionar `kick.ts` → `createCase`; corrigir auto-escalação do `warn.ts`.
2. `ticket.service.ts setPanelMessage` → upsert.
3. Migration de GRANTs faltantes (loop seguro).
4. Adicionar `node scripts/build-commands-json.mjs` no `prebuild` do dashboard. Atualizar `commands.json`.
5. Reescrever `bot/README.md` para Supabase.
6. Auditar `head()` de cada rota pública.

### Etapa C (P2) — refactors em massa, podem ser PRs separados
1. Migração `ephemeral: true` → `flags: MessageFlags.Ephemeral` (find/replace).
2. Validações de input em `lembrete`, `logs`, `embed`, `level addxp`.
3. `levelreward` upsert.
4. Limpeza de `void promise`.

---

## Testes recomendados

### Manuais
- **Race economia**: dois clientes Discord simultâneos rodando `/loja comprar` no mesmo item com estoque 1 e `/roubar` no mesmo alvo. Conferir saldo final no Supabase.
- **Daily race**: dois browsers logados no dashboard chamando `claimDaily` ao mesmo tempo.
- **Cross-guild marriage** (P0-4): tentar usar `/casar` num servidor B com casamento ativo em A.
- **Apelações** (P0-5): criar mod só com `can_warn`, tentar aprovar apelação de ban — deve falhar.
- **/daily sem BOT_API_URL**: rodar dashboard em preview limpo, conferir que NÃO bate em IP de produção.

### Automáticos
- Adicionar teste SQL no Supabase para cada RPC nova (debit/credit/transfer com saldo insuficiente, atomicidade).
- Teste de tipo: `tsgo` no monorepo (`bot/` + raiz) sem novos erros.
- `node scripts/build-commands-json.mjs` no CI; falhar se output divergir do commitado.
- Linter Supabase (`supabase--linter`) pós-migration.

---

## Próximo passo

Confirme:
1. Pode prosseguir para Etapa A?
2. Decisão sobre **P0-4 marriages**: por-guild ou continua global?
3. Sobre **P0-3 supabase-admin**: pode quebrar callers que dependiam do fallback (eles vão receber erro claro e listamos os arquivos a migrar)?
