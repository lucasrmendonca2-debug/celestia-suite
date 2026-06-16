## Fase 4 — Logs do servidor + Tickets v2

Vou atacar os dois módulos em sequência (Logs primeiro, depois Tickets v2), reaproveitando a infra de `mod_cases` e o padrão visual do dashboard.

---

### Parte A — Sistema de Logs do servidor

**Objetivo:** painel de auditoria completo, comparável ao Logger/Dyno, com filtros e canais separados por categoria.

**Migração de banco**
- Estender `guild_logs_config` (já tem 22 colunas) com:
  - canais dedicados por categoria: `message_channel`, `member_channel`, `role_channel`, `channel_channel`, `voice_channel`, `server_channel`, `mod_channel`, `invite_channel`
  - toggles individuais por evento (`log_message_delete`, `log_message_edit`, `log_member_join`, `log_member_leave`, `log_member_update`, `log_role_create/update/delete`, `log_channel_create/update/delete`, `log_voice_join/leave/move`, `log_server_update`, `log_invite_create/delete`, `log_emoji_update`)
  - `ignored_channels text[]`, `ignored_roles text[]`, `ignored_users text[]`
- Nova tabela `server_audit_logs` (id, guild_id, category, event, actor_id, target_id, channel_id, before jsonb, after jsonb, metadata jsonb, created_at) — usada pelo dashboard para histórico pesquisável. TTL de 30 dias via cron.
- GRANT + RLS apropriados.

**Bot — eventos a adicionar/refatorar** (`bot/src/bot/events/`)
- `messageDelete` (já existe) — refatorar para usar novo schema, embed com autor, conteúdo, anexos.
- `messageUpdate` (já existe) — diff before/after.
- `messageDeleteBulk` (novo) — agrupar exclusões em massa.
- `guildMemberAdd` / `guildMemberRemove` (existem) — log dedicado, conta tempo no servidor.
- `guildMemberUpdate` (novo) — mudança de nick, cargos adicionados/removidos, timeout.
- `userUpdate` (novo) — mudança de avatar/username.
- `roleCreate` / `roleUpdate` / `roleDelete` (novos).
- `channelCreate` / `channelUpdate` / `channelDelete` (novos).
- `voiceStateUpdate` (novo) — join/leave/move/mute/deafen.
- `guildUpdate` (novo) — nome, ícone, owner.
- `inviteCreate` / `inviteDelete` (novos).
- `emojiCreate` / `emojiUpdate` / `emojiDelete` (novos).

Cada evento:
1. Lê `guild_logs_config`, verifica toggle e ignored lists.
2. Resolve canal de destino (categoria → fallback global).
3. Posta embed padronizado via `logger.service.ts` (novo helper).
4. Insere linha em `server_audit_logs`.

**Dashboard — `dashboard.$guildId.logs.tsx`** (existe, será reescrito)
- Tabs: **Geral / Mensagens / Membros / Cargos / Canais / Voz / Servidor / Histórico**.
- Cada tab: switch master + canal de destino (DiscordPickers) + toggles individuais.
- Tab "Histórico": tabela paginada de `server_audit_logs` com filtros (categoria, autor, alvo, período) e export CSV.
- Server fns: `getLogsConfig`, `updateLogsConfig`, `listAuditLogs`, `exportAuditLogs`.

---

### Parte B — Tickets v2

**Objetivo:** elevar o sistema atual para padrão comercial (Tickets Bot, Helper.gg).

**Migração de banco**
- `tickets` (já existe, 17 colunas) acrescentar: `claimed_by`, `claimed_at`, `priority` (LOW/MEDIUM/HIGH/URGENT), `tags text[]`, `first_response_at`, `closed_by`, `close_reason`, `rating`, `rating_comment`, `transcript_url`, `sla_deadline`.
- Nova tabela `ticket_tags` (guild_id, name, color, emoji).
- Nova tabela `ticket_notes` (id, ticket_id, author_id, content, internal bool, created_at) — notas privadas do staff.
- Nova tabela `ticket_sla_configs` (guild_id, category_id, first_response_minutes, resolution_hours, alert_role_id).
- `ticket_categories` acrescentar: `claim_required bool`, `auto_close_hours int`, `welcome_embed_id`, `priority_default`.

**Bot — comandos novos/atualizados**
- `/ticket claim` — atribui o ticket ao staff atual, marca `claimed_by`.
- `/ticket transfer @user` — transfere claim.
- `/ticket priority <low|medium|high|urgent>` — muda prioridade, atualiza cor do canal.
- `/ticket tag add/remove <tag>` — gerencia tags.
- `/ticket note <texto>` — nota interna (não visível para o usuário).
- `/ticket rename <nome>` — renomeia canal.
- `/ticket reopen` — reabre ticket fechado (até 7 dias).
- Botões no painel: **Claim**, **Transcript**, **Notas** (modal), **Prioridade** (select).
- Mensagem de avaliação (1-5 estrelas) no fechamento, salva em `tickets.rating`.

**Bot — sistemas**
- `tickets/sla.scheduler.ts` (novo, 60s) — checa tickets sem primeira resposta e alerta cargo configurado.
- `tickets/autoclose.scheduler.ts` (novo, 5min) — fecha tickets inativos conforme `auto_close_hours`.
- `tickets/transcript.ts` (existe) — gerar HTML melhor, fazer upload para Supabase Storage (bucket `ticket-transcripts`, público com URL assinada de 30 dias), salvar em `transcript_url`.

**Dashboard — `dashboard.$guildId.tickets.tsx`**
- Nova tab **SLA & Auto-close**: por categoria, define minutos para primeira resposta, horas até fechar inativo, cargo de alerta.
- Nova tab **Tags**: CRUD de tags com cor/emoji.
- Tab **Categorias** ganha campos: `claim_required`, `priority_default`, `auto_close_hours`.
- Tab **Histórico** (existe): adicionar colunas `claimed_by`, `priority`, `rating`, `tags`, `transcript_url` (link), filtros por prioridade/tag/rating, export CSV.
- Tab **Métricas** (nova): tickets abertos/fechados últimos 30d, tempo médio de primeira resposta, tempo médio de resolução, top 10 staff por volume, distribuição de rating.

**Storage**
- Novo bucket `ticket-transcripts` (privado, URL assinada por 30 dias quando solicitado).

---

### Ordem de execução

1. Migração unificada (logs + tickets v2) — única aprovação.
2. Bot: eventos de logs + helper `logger.service.ts`.
3. Bot: comandos/sistemas/transcripts de tickets v2.
4. Dashboard: rota de Logs (reescrita).
5. Dashboard: tabs novas de Tickets v2.
6. Registro de slash commands + reinício do bot no sandbox.

### Fora de escopo desta fase
Economia, Leveling, VIP, Diversão, Reaction Roles — ficam para fase 5+.
