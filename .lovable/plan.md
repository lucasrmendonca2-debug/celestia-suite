## Sistema de Tickets — Fase 1

**Decisão de arquitetura:** o bot vai ler/escrever no **Supabase Postgres** (mesma fonte do site) via `@supabase/supabase-js` com service role. Adeus Mongo pra esse módulo. Os modelos antigos do Mongoose (`Ticket`, etc.) continuam vivos pra não quebrar nada, mas o sistema novo usa só Supabase.

**Escopo desta fase (testável end-to-end):**
- Schema completo no Supabase (todas as 6 tabelas do brief)
- Bot conectado ao Supabase
- Comando `/ticket painel` envia o painel único
- Botão "Abrir ticket" cria canal privado, salva no DB, envia log
- Botão "Fechar" + `/ticket fechar` arquivam o ticket
- Aba **Geral** do dashboard (ligar/desligar, canais, cargo de suporte, limites)
- Validações de permissão do bot (criar canal, gerenciar permissões)

**Fora desta fase** (vão nas próximas):
- Fase 2: categorias customizadas + permissões dinâmicas por cargo + níveis de acesso
- Fase 3: transcript + reabrir + adicionar/remover usuário + assumir
- Fase 4: avaliação + histórico + aparência

---

### Passo a passo

**1. Migração Supabase** (1 migration, todas as tabelas + RLS + grants)
- `ticket_configs` (config geral por guild)
- `ticket_categories` (categorias — só "default" preenchida na fase 1)
- `ticket_permission_roles` (permissões por cargo — vazia na fase 1)
- `ticket_access_levels` (níveis — vazio na fase 1)
- `tickets` (tickets abertos)
- `ticket_messages`, `ticket_logs`
- RLS: dono do guild lê/escreve via dashboard (checa via `discord_guild_admins` ou similar); service_role total

**2. Bot: integração Supabase**
- `bun add @supabase/supabase-js` no `bot/`
- Novo `bot/src/database/supabase.ts` → cliente service-role
- Novos arquivos em `bot/src/bot/systems/tickets/`:
  - `ticket.service.ts` — CRUD (config, abrir, fechar, log)
  - `ticket.permissions.ts` — checagens (limite, owner, staff role)
  - `ticket.components.ts` — embeds + botões (painel + dentro do ticket)
- Atualiza `bot/src/bot/commands/tickets/panel.ts` para enviar o painel novo
- Reescreve `bot/src/bot/systems/tickets/handlers.ts` para a lógica nova (mantém os custom IDs `ticket:open` e `ticket:close`)
- Adiciona `/ticket fechar` em `bot/src/bot/commands/tickets/`
- Adiciona `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` no `bot/.env`

**3. Dashboard: página /dashboard/[guildId]/tickets**
- `src/lib/tickets.functions.ts` — serverFns: `getTicketConfig`, `updateTicketConfig`, `sendPanel` (chama o bot? não — gera embed e envia via REST do Discord usando token do bot)
- `src/routes/_authenticated/dashboard/$guildId/tickets.tsx` — página com tabs (shadcn `Tabs`)
- Componente `TicketGeneralTab.tsx` com:
  - Switch "Sistema ativo"
  - Select canal do painel, canal de logs, categoria Discord
  - Select cargo de suporte padrão
  - Number max tickets por usuário
  - Switches: permitir usuário fechar / habilitar transcript / habilitar avaliação
  - Botão "Salvar" + "Enviar painel agora"
- Outras tabs (Painel, Categorias, Permissões...) → stub "Em breve" só com header

**4. Validação**
- Build do bot passa
- Rebuilda e reinicia bot
- Testo o fluxo manualmente nos logs (script de smoke se necessário)

### Detalhes técnicos

- Bot usa **service_role** → bypassa RLS (é confiável, está no servidor). Não exponho a chave em lugar nenhum do dashboard.
- Custom IDs dos botões: `ticket:open:<categoryId>`, `ticket:close:<ticketId>`. Já existe parser em `handlers.ts`.
- A página do dashboard precisa carregar canais/cargos do Discord para os selects — uso o token do bot via `GET /guilds/:id/channels` e `/guilds/:id/roles` em serverFn (com cache curto).
- Painel envia: embed + ActionRow com botão "Abrir ticket" (na fase 1 só uma categoria default; na fase 2 vira menu).
- Ao abrir: cria canal `ticket-<username>` na categoria configurada, aplica overwrites (everyone deny, user allow, support role allow, bot allow).

### Como testar (após eu entregar)
1. Aprovar a migração
2. Eu adiciono os secrets do Supabase no `bot/.env` e reinicio
3. Você abre `/dashboard/<guildId>/tickets` → aba Geral, configura canais e clica "Salvar" → "Enviar painel"
4. No Discord, clica o botão "Abrir ticket" → vê canal criado, mensagem com botão fechar
5. Clica fechar → canal arquivado, log enviado

Próxima fase começa quando você validar essa.