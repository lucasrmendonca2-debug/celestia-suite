# Sistema de Moderação Profissional

Implementação em **5 fases incrementais**, cada uma deixa o sistema usável e testável antes da próxima. Stack: Postgres (Supabase) — não Prisma — para manter coerência com o resto do bot. Tabelas serão criadas via migration com RLS + GRANTs.

## Fase 1 — Fundação (Banco + permissões + página dashboard vazia)

**Banco** — migration única criando:
- `moderation_configs` — config geral por guild (log_channel_id, mute_role_id, max_warnings, default_warn_punishment, protected_role_ids[], protected_user_ids[], allow_temp_ban, allow_temp_mute, dm_punished_user, punishment_dm_template, embed_color, etc.)
- `moderation_permission_roles` — uma linha por cargo com 15 booleans (can_ban, can_kick, can_mute, can_warn, can_clear, can_lock, can_manage_automod, can_view_history, can_view_logs, can_manage_blacklist, can_manage_config, ...)
- `punishments` — id, guild_id, user_id, username, moderator_id, moderator_name, type (enum: BAN/TEMP_BAN/KICK/MUTE/TEMP_MUTE/WARN/CLEAR/LOCK/UNLOCK/SLOWMODE/UNBAN/UNMUTE), reason, duration_seconds, expires_at, active, created_at
- `warnings` — id, guild_id, user_id, moderator_id, reason, active
- `moderation_logs` — id, guild_id, user_id, moderator_id, action, reason, details (jsonb)
- `automod_configs` (já existe `automod_config`, vou reaproveitar + ALTER)
- `blacklisted_words` — id, guild_id, word, punishment, delete_message, active
- `allowed_domains` — id, guild_id, domain
- `temporary_actions` — id, guild_id, user_id, action_type, expires_at, active

Todas com GRANTs `service_role` (bot) + `authenticated` (dashboard) e RLS via security-definer `user_can_manage_guild()`.

**Dashboard** — Nova rota `dashboard.$guildId.moderation.tsx` com tabs vazias (placeholders). Apenas a aba **Geral** funcional nesta fase. Item "Moderação" no menu lateral.

**Bot** — pasta `bot/src/bot/systems/moderation/` com `moderation.service.ts` (CRUD config) e `moderation.permissions.ts` (validação hierarquia + cargos protegidos + OWNER_ID + role do staff + role do bot).

## Fase 2 — Comandos manuais essenciais (Prioridade 1)

`/ban`, `/kick`, `/mute` (timeout nativo do Discord), `/warn`, `/clear`. Todos:
- Validam permissão configurada no dashboard
- Validam hierarquia (cargo do staff > cargo do alvo; cargo do bot > cargo do alvo)
- Validam usuário/cargo protegido
- Persistem em `punishments` + `moderation_logs`
- Postam embed bonito no canal de logs configurado
- Mandam DM ao punido (se ativo)

**Dashboard:** aba **Permissões** (lista de cargos com 15 toggles, picker de cargo para adicionar) + aba **Histórico** (tabela das punições com filtros por usuário/moderador/tipo/data/status).

## Fase 3 — Punições temporárias + utilitários (Prioridade 2)

`/unban`, `/unmute`, `/warnings`, `/removewarn`, `/lock`, `/unlock`, `/slowmode`, `/modhistory`, `/modconfig`.

Mute/ban temporário: `/mute @user 10m motivo` registra em `temporary_actions` com `expires_at`. Scheduler já existente (1 min tick) ganha um job que faz unmute/unban quando expira.

Sistema de **escalation** de warns: ao atingir `max_warnings`, aplica `default_warn_punishment` automaticamente.

**Dashboard:** aba **Punições** (max_warnings, ação automática, duração mute padrão, DM ativo, template DM).

## Fase 4 — AutoMod (Prioridade 3)

`messageCreate` listener com pipeline:
1. Ignorar admins, bot, cargos/canais ignorados
2. Anti-spam (X msgs em Y segundos via cache em memória + Redis-like LRU)
3. Anti-flood (mensagens repetidas)
4. Anti-mass-mention
5. Anti-invite (regex `discord.gg/`)
6. Anti-link (com whitelist `allowed_domains`)
7. Blacklist palavras (match boundary)

Cada gatilho: apaga (se configurado), aplica punição configurada (warn/mute_temp/kick/ban), loga.

**Dashboard:** abas **AutoMod**, **Anti-Spam**, **Anti-Link** (+ domínios permitidos), **Blacklist** (CRUD palavras).

## Fase 5 — Acabamento (Prioridade 3 final)

Aba **Logs** (toggles por tipo de evento + preview). Aba **Aparência** (cor embeds, rodapé, ícone, mensagens customizadas com preview). Gating visual das abas conforme permissão no banco. Renomear `automod_config` antigo se necessário, ajustes finais.

## Detalhes técnicos

- **Permissões dashboard:** server fn `assertCanModerate(guildId, capability)` verifica OWNER_ID env > dono da guild (Discord API) > `moderation_permission_roles` casado com cargos do usuário.
- **Permissões bot:** helper `assertCanPunish(staff, target, capability)` em `moderation.permissions.ts`, usado por todo comando antes de agir.
- **Mute:** preferir timeout nativo do Discord (até 28 dias) e fallback para mute_role_id quando configurado.
- **Hierarquia:** sempre `staff.roles.highest.position > target.roles.highest.position` (exceto owner) e `botMember.roles.highest.position > target.roles.highest.position`.
- **Logs:** componente compartilhado `buildModLogEmbed(action, target, moderator, reason, ...)` reaproveitado em todos os pontos.

## Por que faseado

Cada fase é deployável e testável. Se eu fizer tudo de uma vez (10+ tabelas, 14 comandos, 10 abas dashboard, 5 sistemas AutoMod) a chance de bug ou regressão fica enorme e fica difícil revisar. Quero entregar Fase 1 → você testa → Fase 2 → etc.

## Quer que eu comece pela Fase 1 agora?
