## Objetivo

1. Mover o resgate do `/daily` para uma página dedicada do site (estilo Loritta).
2. Melhorar UX, funcionalidades e robustez de **todos** os comandos do bot.
3. Expandir o dashboard com Economia, Moderação, Níveis e Analytics.

Vou entregar em **3 fases** para não estourar contexto. Esta plan cobre a Fase 1 em detalhe; 2 e 3 ficam como roadmap.

---

## FASE 1 — Daily no site + base de UX dos comandos (esta entrega)

### 1.1 Página `/daily` dedicada (fora do dashboard)

Nova rota pública `src/routes/daily.tsx`:
- Layout próprio (não usa shell do dashboard), tema escuro com o gradiente do site.
- Aceita `?token=<jwt>` vindo do bot.
- Se não logado: botão "Entrar com Discord" preservando o token.
- Se logado e token válido: mostra card com streak atual (🔥 X dias), recompensa do dia, multiplicador premium, calendário visual da semana, botão grande "Resgatar agora".
- Pós-resgate: confetti + mostra próximo resgate disponível (countdown em tempo real).
- Se já resgatou: estado bloqueado com countdown.

### 1.2 Backend do daily

Server functions em `src/lib/daily.functions.ts`:
- `createDailyToken({ guildId, userId })` — gera JWT curto (10 min) assinado com `SESSION_SECRET`, contém `userId` + `guildId`.
- `getDailyStatus({ token })` — valida token, retorna `{ streak, nextAmount, canClaim, nextClaimAt, premiumMultiplier }`.
- `claimDaily({ token })` — atômico via `findOneAndUpdate` com cutoff (já refatorado no AUDIT). Aplica streak, salva, retorna recompensa final.

Reaproveita a lógica atômica já existente no `bot/src/bot/commands/economy/daily.ts` — extrai para `bot/src/shared/daily.ts` e o site importa via wrapper Node compatível (chamada HTTP interna do bot, ou conexão Mongo direta do site via `MONGO_URI`).

**Decisão técnica:** o site conecta direto no MongoDB (mesmo padrão que outras telas do dashboard já usam), evitando dependência do bot estar online.

### 1.3 Comando `/daily` reescrito

`bot/src/bot/commands/economy/daily.ts`:
- Não credita mais direto. Gera token via helper compartilhado.
- Responde com embed estilizado: avatar do bot, descrição "Resgate sua recompensa diária no site!", mostra streak atual e próximo bônus.
- Botão `ButtonBuilder` link → `https://zenoxbot.lovable.app/daily?token=...`.
- Botão secundário "Ver minha economia" → `/saldo`.
- Se já resgatou hoje: embed vermelho com countdown.

### 1.4 Padronização visual de embeds (base reutilizável)

Novo `bot/src/bot/lib/embeds.ts`:
- `successEmbed(title, desc)` — verde `#22c55e`
- `errorEmbed(title, desc)` — vermelho `#ef4444`
- `warnEmbed`, `infoEmbed`, `economyEmbed`, `modEmbed`, `levelEmbed`, `funEmbed` — cada categoria com cor própria
- Footer padrão com nome do bot + timestamp
- Helper `confirmButtons(idYes, idNo)` para confirmações inline

Migra os 4 comandos mais usados (`/daily`, `/saldo`, `/work`, `/rank`) para usar esses helpers como prova de conceito. Demais comandos migrados na Fase 2.

### 1.5 MessageFlags.Ephemeral migration

Substituir todos os `ephemeral: true` (deprecated no discord.js v14.16+) por `flags: MessageFlags.Ephemeral` em todos os comandos — fix linear, ~50 lugares.

### 1.6 Race conditions restantes do AUDIT

- `/rob`: atomic `updateOne` no alvo com filtro de saldo
- `/shop` compra: atomic decrement de `stock` com filtro `{ stock: { $gte: qty } }`
- `/kick`: passa a gerar `mod_case` igual `/ban` e `/mute`

---

## FASE 2 — Melhoria sistêmica dos comandos (roadmap)

- Aplicar embed helpers a **todos** os comandos restantes (categorizados)
- Adicionar autocomplete em comandos com itens dinâmicos (shop, missions, badges)
- Rate-limit por usuário (cooldown maps com TTL) em comandos custosos
- Comandos novos: `/work` (com mini-jobs), `/crime` (risco/recompensa), `/leaderboard` interativo com paginação por botões, `/perfil` redesenhado com card canvas
- Error wrapper global: try/catch em todo handler, log estruturado + resposta amigável

## FASE 3 — Expansão do dashboard (roadmap)

- **Economia**: editor de loja (CRUD com upload de imagem), missões com cron preview, config do daily (valor base, streak bonus, premium 2x), tabela de transações com filtros
- **Moderação**: timeline de casos com filtros, botão revogar/editar punição, editor de automod (slider de severidade, regex tester), blacklist com import CSV
- **Níveis**: editor de fórmula XP com preview gráfico, recompensas por nível drag-and-drop, multiplicadores por canal/role
- **Analytics**: dashboard com Recharts — comandos mais usados (7d/30d), membros ativos, economia circulante, novos casos de moderação

---

## Arquivos da Fase 1

Criar:
- `src/routes/daily.tsx`
- `src/lib/daily.functions.ts`
- `src/components/daily/DailyCard.tsx`
- `src/components/daily/StreakCalendar.tsx`
- `bot/src/bot/lib/embeds.ts`
- `bot/src/shared/daily-token.ts` (assinar/verificar JWT compartilhado com site)

Editar:
- `bot/src/bot/commands/economy/daily.ts` (vira "link to site")
- `bot/src/bot/commands/economy/saldo.ts`, `work.ts`, `rob.ts`, `shop.ts`
- `bot/src/bot/commands/level/rank.ts`
- `bot/src/bot/commands/moderation/kick.ts` (gerar mod_case)
- Todos os comandos com `ephemeral: true` → `flags: MessageFlags.Ephemeral`

Posso começar pela Fase 1 agora?