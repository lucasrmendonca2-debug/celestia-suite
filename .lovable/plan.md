# Auditoria Profunda — Comandos do Bot Zenox

> Levantamento somente leitura. Nada foi alterado. Aprove antes de eu sair codando.

---

## TL;DR — descoberta nº 0 (acima de tudo)

**`bot/src/database/models.js` NÃO existe.** Mas é importado por **28 arquivos** (`EconomyAccount`, `GuildConfig`, `InventoryItem`, `ShopItem`, `Marriage`, `Giveaway`, `LevelAccount`, `Ticket`, `VipMembership`, `Reminder`, `Announcement`, `CustomCommand`, `EmbedTemplate`, `Punishment`, etc.). Em produção, o processo derruba antes de qualquer `/comando` rodar. **Toda a Fase 1 gira em torno disso.**

---

## 1) Inventário (resumo)

83 comandos mapeados em 10 categorias. Tabela completa com `comando · categoria · idioma · cooldown · perms · EmbedFactory? · TargetValidator? · banco · problemas · prioridade` será salva em `bot/AUDIT.md` (já há um arquivo lá; será substituído pelo inventário novo).

Distribuição:

| Categoria   | Total | Mongoose (quebrado) | Supabase | EmbedFactory (`ui`) | `brandEmbed` legado | `lib/embeds` 3º sistema |
|-------------|-------|---------------------|----------|---------------------|---------------------|-------------------------|
| economy     | 13    | 11                  | 2        | 7                   | 5                   | 1 (`daily`)             |
| config      | 5     | 4                   | 1        | 0                   | 5                   | 0                       |
| moderation  | 23    | 0                   | 23       | 0                   | 23                  | 0                       |
| level       | 7     | 0                   | 7        | 1                   | 6                   | 0                       |
| utility     | 11    | 3                   | 6        | 1                   | 10                  | 0                       |
| fun         | 5     | 0                   | 0        | 3                   | 2                   | 0                       |
| interaction | 10    | 2                   | 0        | 9 (via _factory)    | 3                   | 0                       |
| events      | 2     | 1 (`giveaway`)      | 1        | 0                   | 2                   | 0                       |
| premium     | 3     | 0                   | 3        | 1                   | 2                   | 0                       |
| tickets     | 1     | 0                   | 1        | 0                   | 1                   | 0                       |

---

## 2) Problemas críticos (P0 / P1)

| ID    | Onde                                                             | Sintoma                                                              |
|-------|------------------------------------------------------------------|----------------------------------------------------------------------|
| CB-1  | 28 arquivos                                                      | Importam `../../../database/models.js` que **não existe** → crash    |
| CB-2  | `events/interactionCreate.ts:99-100`                             | `isVip:false` e `isPremiumGuild:false` hardcoded → `vip_only` / `premium_guild_only` no `command_permissions` **bloqueia todo mundo** |
| CB-3  | `guards/permissions.ts` + `interactionCreate.ts`                 | `SlashCommand.vipOnly` / `premiumGuildOnly` / `staffOnly` / `premium` **nunca são lidos** — só decoração |
| CB-4  | `premium/vip.ts` (`guildOnly:false`)                             | Subcomando `resgatar` usa `interaction.guild!.members.fetch` → crasha em DM |
| CB-5  | `interactionCreate.ts:91-117`                                    | Cooldown é gravado **antes** do `checkCommandPermission`; usuário fica em cooldown mesmo quando o comando foi negado |
| CB-6  | `utility/help.ts:168`                                            | URL hardcoded do preview Lovable em vez de `env.APP_URL`             |
| CB-7  | `utility/central.ts`                                             | Lê `LevelAccount` (Mongoose) enquanto o módulo Level inteiro grava em Supabase → mostra dados zerados/errados |
| CB-8  | `config/logs.ts`, `moderation/apelacoes.ts`                      | `staffOnly:true` + CB-3 → sempre bloqueado ou sempre aberto, dependendo da linha em `command_permissions` |
| CB-9  | `economy/daily.ts`                                               | Sem `BOT_API_SECRET` retorna erro; comentário diz "fallback local" mas não existe fallback |
| CB-10 | `moderation/{clear,purge,lock,unlock,slowmode}.ts`               | Sem `botPermissions` declarado → falham silenciosamente quando o bot não tem `ManageMessages/ManageChannels` |
| CB-11 | `moderation/purge.ts:73`                                         | Loga ação como `"CLEAR"`, não `"PURGE"`                              |
| CB-12 | `moderation/warn.ts:65-66`                                       | Import duplicado de `random-responses.js`                            |
| CB-13 | Registry vs Collection                                            | `client.commands.get()` é o gate real; `systems/registry` só serve pro `/help` (`hidden_from_help` nunca é respeitado) |

---

## 3) Problemas de experiência (UX)

- **3 sistemas de embed convivendo**: `ui` (`embed.factory`), `brandEmbed` (legado) e `embeds` (`lib/embeds`, só no `daily`). Cada categoria tem cor/identidade diferente dependendo de qual arquivo foi tocado por último.
- **Mistura PT/EN**:
  - Comando em EN sem `nameLocalizations`: `pay`, `rob`, `marry`, `divorce`, `ship`, `warn`, `warns`, `removewarn`, `case`, `history`, `note`, `reason`, `clear`, `purge`, `modstats`, `tempban`, `tempmute`, `kick` (parcial), `nickname`, `levelreward`, `admin-premium`.
  - Subcomandos misturados: `/loja` tem `rotacao`, `rotacionar` (PT) + `list`, `add`, `remove`, `buy` (EN).
- **Ephemeral inconsistente**: `/ban /kick /warn` confirmam **público**, revelando ação do mod; `/history /warns /case` são ephemerais. Não há regra.
- **`level/level.ts:63`**: kind `warn` (amarelo) com título `✅ XP removido` — semáforo trocado.
- **`perfil`, `temporada`, `rep`** caem em `content:` puro em estados vazios — quebra o visual.
- **`slowmode`** valida `can_lock_channel` (capability errada).
- **Personalidade**: `/economia`, `/inventario`, `/missoes`, `/giveaway`, todos os mods em EN, e `/help` usam respostas genéricas (sem `pick(...responses)` da pasta `systems/personality`).
- **`/help`**: hardcoded link de preview; não filtra `hidden_from_help`; não mostra `premium`/`vip` badge; não respeita perms do membro.

---

## 4) Duplicatas / sobreposições

| Conjunto                              | Resolução proposta                                          |
|---------------------------------------|-------------------------------------------------------------|
| `/ban` (com `duracao`) ↔ `/tempban`   | Manter `/ban`; remover `/tempban` ou virar alias hidden     |
| `/mute` (com `duracao`) ↔ `/tempmute` | Mesma coisa                                                 |
| `/ranking` ↔ `/economia rank`         | Manter `/economia rank`; transformar `/ranking` em atalho ou remover |
| `/rep top` ↔ `/toprep`                | Remover `/toprep`                                           |
| `/premium servidor` ↔ `/premium painel` | Mesma função literal — fundir                            |
| `/clear` ↔ `/purge`                   | Decidir um nome (sugestão: `/limpar`) com aliases ocultos   |

---

## 5) Oportunidades de inovação (sistemas, não comandos)

Tudo aproveita o que **já existe** em `systems/` (economy, level, social, personality, scheduler, premium, automod, tickets):

1. **Missões diárias/semanais automáticas** — `systems/economy/missions` + `systems/scheduler` já existem; falta rotação, claim, push no `/perfil` e empurrão no chat quando o usuário fica perto de concluir.
2. **Conquistas inteligentes** com gatilho por evento (`messageCreate`, `voiceStateUpdate`, `mod_cases`) — virar background reactor, não comando.
3. **Loja rotativa** com janela de 24h, item "limited", desconto por reputação.
4. **Temporadas de economia** (já existe `seasons` no level) estendido para wallet/social; reset opcional com soft-reset de prestígio.
5. **Central do usuário** — `/perfil` vira hub: nível, missões ativas, próximas conquistas, status VIP, lembretes.
6. **Jornada do membro novo** — primeiros 7 dias: tutorial em DM/canal, boost de XP, recomendação de comandos com base no que o servidor tem ativado.
7. **Recomendador de configuração** — analisa `bot_guild_presence` e sugere "ative AutoMod", "configure logs em #x" no `/config` e no dashboard.
8. **AutoMod por regras** — `systems/automod` já tem incidentes; falta escada (warn → mute → ban temp) configurável e explicação amigável pro membro.
9. **Tickets com automação** — auto-resposta por categoria, claim, SLA, transcript ao fechar (boa parte já no `ticket.ts`, falta polir).
10. **Ranking semanal/mensal** com snapshot e cargo temporário "Destaque da semana".
11. **Social com relações** — `marry`/`divorce` virar parte de um sistema `relations` (amigo, casado, rival) com XP de relação.
12. **Insights e alertas no dashboard** — picos de mensagens, queda de retenção, comandos mais usados, automod top-ofender.
13. **Bot personality** — usar `systems/personality` em **todas** as respostas, com variação por horário e por humor do servidor (tag de evento ativo).

---

## 6) Plano de correção (7 fases)

> Cada fase entrega valor sozinha, pode ser revisada/aprovada antes da próxima.

### Fase 1 — Base não-quebrada (P0)
- Resolver `database/models.js`: migrar os 11 modelos efetivamente usados para Supabase (`economy_accounts`, `inventory_items`, `shop_items`, `marriages`, `giveaways`, `reminders`, `announcements`, `custom_commands`, `embed_templates`, `level_accounts` (já existe), `vip_memberships`).
- Para cada modelo migrado: tabela + GRANT + RLS + policies + service-role-only writes do bot, exatamente como o resto do projeto.
- Reescrever `central.ts` para ler de Supabase (mata CB-7).
- Daily com fallback local real ou marcar a flag de bridge obrigatória.
- Critério: bot sobe sem warning de import; `/saldo`, `/depositar`, `/sacar`, `/trabalhar`, `/crime`, `/loja`, `/inventario`, `/missoes`, `/daily`, `/lembrete`, `/anuncio`, `/sorteio`, `/comando`, `/embed`, `/config`, `/automod` rodam.

### Fase 2 — Idioma, nomes e duplicatas
- Renomear: `pay→pagar`, `rob→roubar`, `marry→casar`, `divorce→divorciar`, `ship→shippar`, `warn→avisar`, `warns→avisos`, `removewarn→removeraviso`, `case→caso`, `history→historico`, `note→anotar`, `reason→motivo`, `clear/purge→limpar`, `modstats→modstats` (manter), `tempban→ban duracao:` (remover), `tempmute→mute duracao:` (remover), `nickname→apelido`, `levelreward→nivelrecompensa`, `admin-premium→admin-premium` (ownerOnly, ok), `toprep→/rep top`, `ranking→/economia rank`, `premium painel→premium servidor`.
- Cada comando renomeado mantém `nameLocalizations.en-US` com o nome antigo.
- Padronizar subcomandos do `/loja` para PT.
- Toda renomeação roda **migração de slash registry** (`scripts/registerCommands.ts`).

### Fase 3 — Permissões, VIP, Premium, Staff
- `interactionCreate.ts`: resolver `isVip` via `systems/vip` e `isPremiumGuild` via `systems/premium`. Cache curto por interaction.
- `guards/permissions.ts`: passar a respeitar `vipOnly`, `premiumGuildOnly`, `staffOnly`, `premium`, `ownerOnly` do `SlashCommand`.
- Reordenar `interactionCreate`: **permissão antes do cooldown** (mata CB-5).
- `/help`: respeitar `hidden_from_help`; mostrar badge VIP/Premium/Staff; filtrar por perms do membro.
- Capacidades certas: `/slowmode` ganha `can_slowmode`; `/apelacoes` ganha `can_manage_appeals`; `/purge` loga `"PURGE"`.

### Fase 4 — Personalidade e embeds
- Eliminar `brandEmbed` e `lib/embeds`: tudo passa a usar `ui.*` do `embed.factory`.
- Padronizar `ephemeral`: confirmações sensíveis (mod actions) ephemeral; modlog vai pro canal de logs.
- Cada comando ganha `longDescription` e `examples` (alimenta `/help` e dashboard).
- Trocar respostas genéricas por `pick(...)` do `systems/personality` (já tem `economyResponses`, `utilityResponses`, etc.).
- Validação de alvo em todo lugar que aceita `usuario`: usar `classifyTarget` (self, bot_self, bot_other) com mensagens da personality.
- Corrigir `level.ts` (kind/title), embeds vazios no `perfil`/`temporada`/`rep`.

### Fase 5 — Sistemas automáticos inovadores
- Missions runner (rotação, claim, push).
- Achievements reactor por evento.
- Loja rotativa + temporadas de economia.
- Jornada do membro novo + recomendador de configuração.
- AutoMod com escada configurável.
- Snapshot semanal de ranking + cargo "Destaque".
- Relações sociais (`relations` table).
- Tudo background-job via `systems/scheduler`, sem comando novo "à toa".

### Fase 6 — Dashboard de comandos
- Página `dashboard/$slug/comandos-bot` (já existe) vira CRUD completo de `command_permissions`: enable/disable, roles allowed/denied, channels allowed/denied, staff_only, vip_only, premium_guild_only, hidden_from_help, cooldown_override.
- Mostrar `longDescription`/`examples` puxados do registry.
- Preview de quem pode usar (simulador de membro).

### Fase 7 — Testes finais
- Smoke automático: registrar comandos num guild de teste; rodar `/help`, comandos públicos, mod actions, economy loop.
- Pen-test leve: VIP gating, premium gating, staff gating, cooldown bypass, RLS dos modelos migrados, DM crashes.
- Lint final: zero `database/models.js`, zero `brandEmbed`, zero `lib/embeds`, zero comandos sem `longDescription`/`examples`/`module`.
- Relatório em `bot/AUDIT.md` final + checklist QA manual em `.lovable/`.

---

## Próximo passo

Confirma o escopo (ou marca o que quer cortar/adicionar) que eu começo pela **Fase 1**. Quer que eu já gere o `bot/AUDIT.md` com o inventário completo (tabela linha-a-linha dos 83 comandos) junto com a aprovação, ou só depois que você der OK no plano?
