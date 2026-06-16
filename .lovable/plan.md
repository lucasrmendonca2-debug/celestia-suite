# Fase 3 — Moderação Profissional Avançada

Após a Fase 2 (ações principais funcionando), esta fase eleva o sistema ao nível dos bots comerciais (Dyno, Wick, MEE6 Pro). Foco em **qualidade do histórico**, **automação temporal real** e **upgrades no /warn**.

---

## 1. Upgrade do sistema de Warnings

Hoje o `/warn` é binário (warn ativo ou removido). Vamos torná-lo profissional:

- **Severidade** (`LOW` / `MEDIUM` / `HIGH`) — cada nível conta como N pontos para a auto-punição (1/2/3). Configurável no dashboard.
- **Expiração automática** — warns viram inativos após X dias (campo `expires_at`). Default 90 dias, configurável.
- **Anotações internas** (`/note`) — registro privado de moderação que NÃO conta como warn, NÃO envia DM, só aparece em `/history` para a staff.
- **/warn com prova** — campo opcional `prova` (URL de imagem/print) anexado no embed e no log.
- **DM com link de apelo** — se `appeal_url` estiver setado na config, o DM ao usuário inclui botão "Apelar".

## 2. Sistema unificado de casos (`mod_cases`)

A tabela `mod_cases` já existe mas está subutilizada. Vamos centralizar tudo:

- Toda ação (ban/kick/mute/warn/unban/unmute/note) cria um `case_id` sequencial por guild.
- Logs do Discord exibem `#42` como referência clicável.
- Novos comandos:
  - `/case <id>` — mostra detalhes completos de um caso.
  - `/history @user` — lista paginada de todos os casos do usuário (ativos + arquivados).
  - `/reason <case_id> <novo motivo>` — edita motivo de um caso registrado.

## 3. Ações temporárias automatizadas

A tabela `temporary_actions` está criada mas vazia. Substituir o scheduler legado (Mongoose) por um worker que:

- Lê `temporary_actions` a cada 30s.
- Expira `TEMP_BAN` → executa `guild.bans.remove()` + log.
- Expira `TEMP_MUTE` → remove `mute_role_id` ou timeout + log.
- Expira `WARN` (com `expires_at`) → marca `active=false`.
- Registra `expired_at` para auditoria.

Comando novo: `/tempban` e `/tempmute` populam essa tabela; o scheduler limpa sozinho.

## 4. Integração com Discord Audit Log

Quando um mod bane/kicka/timeouta um usuário **manualmente** pelo Discord (sem usar o bot), o bot deve detectar via eventos `guildBanAdd` / `guildMemberUpdate` / `guildMemberRemove`, cruzar com o Audit Log e:

- Criar um `mod_case` automático com `source: "DISCORD_UI"`.
- Postar no canal de log de moderação.
- Manter histórico consistente.

## 5. Comandos de utilidade da staff

- `/modstats` — estatísticas do mês (warns/bans/kicks por mod, top infratores).
- `/purge` — bulk delete avançado (filtros por usuário + texto + dias).
- `/nickname` — força mudança de nick com log.

## 6. Dashboard — Aba "Histórico"

Tab `HistoryTab.tsx` (já existe placeholder em tickets, replicar para moderação):

- Filtros: usuário, moderador, tipo de ação, intervalo de datas.
- Paginação server-side via `mod_cases`.
- Botão "Editar motivo" e "Marcar como inválido".
- Export CSV.

## 7. Refinos do bot

- Remover dependência do Mongoose no `scheduler.ts` e `vip.ts` (migrar para Supabase).
- Auto-cleanup: rotina diária limpa `moderation_logs` > 180 dias (configurável).
- Cooldown anti-flood no `/warn` (evita spam de warn em segundos).
- Erro padronizado: todos os comandos de mod com `try/catch` global → embed amigável + log no Sentry-style (Pino).

---

## Detalhes técnicos

**Schema novo:**

```text
ALTER TABLE warnings
  ADD COLUMN severity text DEFAULT 'MEDIUM',  -- LOW/MEDIUM/HIGH
  ADD COLUMN expires_at timestamptz,
  ADD COLUMN proof_url text,
  ADD COLUMN points int DEFAULT 1;

ALTER TABLE moderation_configs
  ADD COLUMN warn_expiry_days int DEFAULT 90,
  ADD COLUMN appeal_url text,
  ADD COLUMN warn_points_low int DEFAULT 1,
  ADD COLUMN warn_points_medium int DEFAULT 2,
  ADD COLUMN warn_points_high int DEFAULT 3;

ALTER TABLE mod_cases
  ADD COLUMN source text DEFAULT 'BOT',  -- BOT/DISCORD_UI/DASHBOARD
  ADD COLUMN edited_at timestamptz,
  ADD COLUMN edited_by text;
```

**Arquivos a criar:**

- `bot/src/bot/systems/moderation/cases.service.ts` — CRUD de mod_cases + auto-incremento de case_id por guild.
- `bot/src/bot/systems/moderation/temporary.scheduler.ts` — worker novo (substitui parte do scheduler.ts).
- `bot/src/bot/systems/moderation/auditlog.watcher.ts` — listener de eventos manuais.
- `bot/src/bot/commands/moderation/note.ts`, `case.ts`, `history.ts`, `reason.ts`, `tempban.ts`, `tempmute.ts`, `modstats.ts`, `purge.ts`, `nickname.ts`.
- `src/components/dashboard/moderation/HistoryTab.tsx`.
- `src/lib/guild/moderation-history.functions.ts`.

**Arquivos a editar:**

- `bot/src/bot/commands/moderation/warn.ts` — severidade, expiração, prova, pontos.
- `bot/src/bot/commands/moderation/ban.ts`, `mute.ts` — registrar via cases.service.
- `bot/src/bot/systems/moderation/moderation.logger.ts` — exibir `#case_id` e botão de apelo.
- `bot/src/bot/events/guildBanAdd.ts` (criar), `guildMemberRemove.ts` (editar) — audit log.
- `src/routes/_authenticated/dashboard.$guildId.moderation.tsx` — nova tab Histórico + 3 campos de severidade/apelo.

---

## Escopo desta entrega

Vou implementar tudo acima em uma única passagem (com migration, código do bot, dashboard). Bot reinicia automaticamente após mudanças.

**Fora do escopo:** Economia, Level, Diversão, VIP — fica para fase posterior.
